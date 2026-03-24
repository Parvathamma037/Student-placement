from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.conf import settings
import pymysql
from rest_framework.response import Response
from rest_framework.decorators import api_view
import os

def get_db_connection():
    """Reusable MySQL connection (always returns DictCursor)"""
    return pymysql.connect(
        host='127.0.0.1',
        port=3306,
        user='root',
        password='root',
        database='webdb4',
        cursorclass=pymysql.cursors.DictCursor  
    )

def ensure_single_teacher():
    try:
        con = get_db_connection()
        with con:
            cur = con.cursor()

            cur.execute("SELECT user_id FROM users1 WHERE role='teacher'")
            teacher = cur.fetchone()

            if teacher:
                cur.execute("""
                    UPDATE users1 
                    SET approved=1, is_admin=1
                    WHERE role='teacher'
                """)
            else:
                cur.execute("""
                    INSERT INTO users1
                    (username, email, password, mobile, address, role, approved, is_admin)
                    VALUES (%s, %s, %s, %s, %s, %s, 1, 1)
                """, (
                    "teacher",
                    "teacher@gmail.com",
                    "teacher",
                    "1234567890",
                    "Hyderabad",
                    "teacher"
                ))

            con.commit()

    except Exception as e:
        print("Teacher creation error:", e)



@api_view(["POST"])
def approve_parent_api(request):
    username = request.data.get("username")
    con = get_db_connection()
    with con:
        cur = con.cursor()
        cur.execute("UPDATE users1 SET approved=1 WHERE username=%s", (username,))
        con.commit()
    return Response({"success": "Parent approved"})



@api_view(["GET"])
def student_page_api(request):
    username = request.GET.get("username")

    if not username:
        return Response({"error": "Studentname required"})

    return Response({"success": "Student page loaded", "username": username})



@api_view(["POST"])
def approve_student_api(request):
    username = request.data.get("username")
    con = get_db_connection()
    with con:
        cur = con.cursor()
        cur.execute("UPDATE users1 SET approved=1 WHERE username=%s", (username,))
        con.commit()
    return Response({"success": "Student approved"})



@api_view(["GET"])
def teacher_page_api(request):
    try:
        con = get_db_connection()
        with con:
            cur = con.cursor(pymysql.cursors.DictCursor)

            # Load only users who need approval
            cur.execute("SELECT * FROM users1 WHERE approved=0")
            users = cur.fetchall()

            # Load only staffs who need approval
            cur.execute("SELECT * FROM users1 WHERE approved=0")
            staffs = cur.fetchall()

        return Response({
            "students": students,
            "parent": parent
        })

    except Exception as e:
        return Response({"error": str(e)})


@api_view(["GET"])
def teacher_student_api(request):
    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)
        cur.execute("SELECT * FROM users1 WHERE role='student'")
        return Response({"student": cur.fetchall()})


@api_view(["GET"])
def teacher_parent_api(request):
    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)
        cur.execute("SELECT * FROM users1 WHERE role='parent'")
        return Response({"parent": cur.fetchall()})




from rest_framework.response import Response
from rest_framework.decorators import api_view
import pymysql

@api_view(["POST"])
def register_api(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    confirm = request.data.get("confirm_password")
    mobile = request.data.get("mobile")
    address = request.data.get("address")
    role = request.data.get("role")   # student / parent

    # Password match check
    if password != confirm:
        return Response({"error": "Passwords do not match"})

    # Allowed roles
    if role not in ["student", "parent"]:
        return Response({"error": "Invalid role"})

    try:
        con = get_db_connection()
        with con:
            cur = con.cursor()

            # ============================
            # UNIQUE CHECKS
            # ============================
            cur.execute("SELECT username FROM users1 WHERE username=%s", (username,))
            if cur.fetchone():
                return Response({"error": "Username already exists"})

            cur.execute("SELECT email FROM users1 WHERE email=%s", (email,))
            if cur.fetchone():
                return Response({"error": "Email already exists"})

            cur.execute("SELECT mobile FROM users1 WHERE mobile=%s", (mobile,))
            if cur.fetchone():
                return Response({"error": "Mobile already exists"})

            # ============================
            # INSERT INTO USERS TABLE
            # ============================
            cur.execute("""
                INSERT INTO users1 
                (username, email, password, mobile, address, role, approved, is_admin)
                VALUES (%s, %s, %s, %s, %s, %s, 0, 0)
            """, (username, email, password, mobile, address, role))

            user_id = cur.lastrowid

            # ============================
            # INSERT INTO ROLE TABLE
            # ============================
            if role == "student":
                cur.execute("INSERT INTO students (student_id) VALUES (%s)", (user_id,))
            else:
                cur.execute("INSERT INTO parents (parent_id) VALUES (%s)", (user_id,))

            con.commit()

        return Response({"success": f"{role.capitalize()} account created. Awaiting teacher approval."})

    except Exception as e:
        return Response({"error": "Database error: " + str(e)})




@api_view(["POST"])
def login_api(request):
    ensure_single_teacher()
    
    username = request.data.get("username")
    password = request.data.get("password")

    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)

        # Fetch user
        cur.execute("SELECT * FROM users1 WHERE username=%s AND password=%s",
                    (username, password))

        user = cur.fetchone()

        if not user:
            return Response({"error": "Invalid login credentials"})

        # Teacher login
        if user["role"] == "teacher":
            return Response({
                "success": "Login successful",
                "role": "teacher",
                "username": username,
                "is_admin": True
            })

        # Student or Parent (needs approval)
        if user["approved"] == 0:
            return Response({"error": "Account not approved by teacher"})

        return Response({
            "success": "Login successful",
            "role": user["role"],
            "username": username
        })


@api_view(["GET"])
def student_details_api(request):
    username = request.GET.get("username")

    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)
        cur.execute("SELECT * FROM users1 WHERE username=%s", (username,))
        student = cur.fetchone()
        if student:
            return Response({"student": student})

    return Response({"error": "Student not found"})

@api_view(["GET"])
def parent_details_api(request):
    username = request.GET.get("username")
    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)
        cur.execute("SELECT * FROM users1 WHERE username=%s", (username,))
        parent = cur.fetchone()
        if parent:
            return Response({"parent": parent})

    return Response({"error": "parent not found"})

# teacher mark attendence
@api_view(["POST"])
def mark_attendance_api(request):
    student = request.data.get("student")
    date = request.data.get("date")
    status = request.data.get("status")
    teacher = request.data.get("teacher")

    con = get_db_connection()
    with con:
        cur = con.cursor()
        cur.execute("""
            INSERT INTO attendance (student_id, date, status, marked_by)
            VALUES ((SELECT student_id FROM students WHERE student_id =
                    (SELECT user_id FROM users1 WHERE username=%s)),
                    %s, %s,
                    (SELECT user_id FROM users1 WHERE username=%s))
        """, (student, date, status, teacher))
        con.commit()

    return Response({"success": "Attendance marked"})

# teacher add assignments
@api_view(["POST"])
def add_assignment_api(request):
    title = request.data.get("title")
    description = request.data.get("description")
    deadline = request.data.get("deadline")
    teacher = request.data.get("teacher")

    con = get_db_connection()
    with con:
        cur = con.cursor()
        cur.execute("""
            INSERT INTO assignments (teacher_id, title, description, deadline)
            VALUES (
                (SELECT user_id FROM users1 WHERE username=%s),
                %s, %s, %s
            )
        """, (teacher, title, description, deadline))
        con.commit()

    return Response({"success": "Assignment uploaded"})


# teacher give grades
@api_view(["POST"])
def give_grade_api(request):
    student = request.data.get("student")
    assignment = request.data.get("assignment_id")
    marks = request.data.get("marks")
    feedback = request.data.get("feedback")  # NEW

    con = get_db_connection()
    with con:
        cur = con.cursor()

        cur.execute("""
            INSERT INTO grades (student_id, assignment_id, marks, feedback)
            VALUES (
                (SELECT student_id FROM students WHERE student_id =
                (SELECT user_id FROM users1 WHERE username=%s)),
                %s,
                %s,
                %s
            )
        """, (student, assignment, marks, feedback))

        con.commit()

    return Response({"success": "Grade added"})



# student view attendence
@api_view(["GET"])
def student_attendance_api(request):
    username = request.GET.get("username")

    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)

        # Get student_id
        cur.execute("SELECT user_id FROM users1 WHERE username=%s AND role='student'", (username,))
        user = cur.fetchone()

        if not user:
            return Response({"error": "Student not found"})

        student_id = user["user_id"]

        # Get attendance list
        cur.execute("SELECT * FROM attendance WHERE student_id=%s ORDER BY date DESC", (student_id,))
        records = cur.fetchall()

    return Response({"attendance": records})

# student see assignments
@api_view(["GET"])
def student_assignments_api(request):
    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)

        cur.execute("""
            SELECT assignment_id, title, description, deadline, created_at
            FROM assignments
            ORDER BY created_at DESC
        """)

        assignments = cur.fetchall()

    return Response({"assignments": assignments})




# student submit attendence
@api_view(["POST"])
def student_submit_assignment_api(request):
    student_username = request.data.get("username")
    assignment_id = request.data.get("assignment_id")
    file = request.FILES.get("file")

    if not file:
        return Response({"error": "File required"})

    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)

        # Get student user_id
        cur.execute(
            "SELECT user_id FROM users1 WHERE username=%s", 
            (student_username,)
        )
        student = cur.fetchone()

        if not student:
            return Response({"error": "Invalid student"})

        student_id = student["user_id"]

        # Save file manually
        file_path = f"uploads/{file.name}"
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)

        with open(full_path, "wb") as f:
            for chunk in file.chunks():
                f.write(chunk)

        # Insert into submissions
        cur.execute("""
            INSERT INTO submissions (assignment_id, student_id, file_path)
            VALUES (%s, %s, %s)
        """, (assignment_id, student_id, file_path))

        con.commit()

    return Response({"success": "Assignment submitted"})


# student view grades
@api_view(["GET"])
def student_grades_api(request):
    username = request.GET.get("username")

    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)

        # Get student ID
        cur.execute("SELECT user_id FROM users1 WHERE username=%s", (username,))
        student = cur.fetchone()

        if not student:
            return Response({"error": "Student not found"})

        student_id = student["user_id"]

        # Fetch grades
        cur.execute("""
            SELECT g.grade_id, g.marks, g.feedback, g.graded_at,
                   a.title AS assignment_title
            FROM grades g
            JOIN assignments a ON g.assignment_id = a.assignment_id
            WHERE g.student_id=%s
            ORDER BY g.graded_at DESC
        """, (student_id,))
        
        grades = cur.fetchall()

    return Response({"grades": grades})


# parent sections
@api_view(["GET"])
def parent_children_api(request):
    """
    Return ALL students for parent to choose from.
    """
    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)
        cur.execute("""
            SELECT 
                u.user_id AS student_id,
                u.username,
                u.email,
                u.mobile
            FROM users1 u
            WHERE u.role='student'
        """)
        students = cur.fetchall()

    return Response({"children": students})



# parent see children attendence
@api_view(["GET"])
def parent_child_attendance_api(request):
    student_id = request.GET.get("student_id")

    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)

        cur.execute("""
            SELECT date, status 
            FROM attendance
            WHERE student_id=%s
            ORDER BY date DESC
        """, (student_id,))

        data = cur.fetchall()

    return Response({"attendance": data})


# parent see children grades
@api_view(["GET"])
def parent_child_grades_api(request):
    student_id = request.GET.get("student_id")

    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)

        cur.execute("""
            SELECT g.grade_id, g.marks, g.feedback, g.graded_at,
                   a.title AS assignment_title
            FROM grades g
            JOIN assignments a ON a.assignment_id = g.assignment_id
            WHERE g.student_id=%s
        """, (student_id,))

        grades = cur.fetchall()

    return Response({"grades": grades})


@api_view(["POST"])
def add_mcq_api(request):
    question = request.data.get("question")
    optionA = request.data.get("optionA")
    optionB = request.data.get("optionB")
    optionC = request.data.get("optionC")
    optionD = request.data.get("optionD")
    correct = request.data.get("correctAnswer")
    teacher = request.data.get("teacher")

    if not all([question, optionA, optionB, optionC, optionD, correct]):
        return Response({"error": "All fields required"})

    con = get_db_connection()
    with con:
        cur = con.cursor()
        cur.execute("""
            INSERT INTO mcq_questions
            (teacher_id, question, option_a, option_b, option_c, option_d, correct_answer)
            VALUES (
                (SELECT user_id FROM users1 WHERE username=%s),
                %s,%s,%s,%s,%s,%s
            )
        """, (teacher, question, optionA, optionB, optionC, optionD, correct))
        con.commit()

    return Response({"success": "MCQ added successfully"})



@api_view(["GET"])
def student_view_mcq_api(request):
    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)
        cur.execute("""
            SELECT mcq_id, question, option_a, option_b, option_c, option_d
            FROM mcq_questions
            ORDER BY created_at DESC
        """)
        mcqs = cur.fetchall()

    return Response({"mcqs": mcqs})


@csrf_exempt
@api_view(["POST"])
def submit_mcq_api(request):
    username = request.data.get("username")
    mcq_id = request.data.get("mcq_id")
    selected = request.data.get("selected_answer")

    if not all([username, mcq_id, selected]):
        return Response({"error": "Missing data"})

    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)

        # ✅ Ensure student
        cur.execute("""
            SELECT user_id FROM users1 
            WHERE username=%s AND role='student'
        """, (username,))
        student = cur.fetchone()

        if not student:
            return Response({"error": "Invalid student"})

        student_id = student["user_id"]

        # ✅ Check MCQ exists
        cur.execute("""
            SELECT correct_answer FROM mcq_questions 
            WHERE mcq_id=%s
        """, (mcq_id,))
        mcq = cur.fetchone()

        if not mcq:
            return Response({"error": "MCQ not found"})

        # ✅ Prevent multiple attempts
        cur.execute("""
            SELECT answer_id FROM mcq_answers 
            WHERE mcq_id=%s AND student_id=%s
        """, (mcq_id, student_id))

        if cur.fetchone():
            return Response({"error": "Already attempted this question"})

        # Auto evaluation
        is_correct = 1 if selected == mcq["correct_answer"] else 0

        cur.execute("""
            INSERT INTO mcq_answers
            (mcq_id, student_id, selected_answer, is_correct)
            VALUES (%s,%s,%s,%s)
        """, (mcq_id, student_id, selected, is_correct))

        con.commit()

    return Response({
        "success": "Answer submitted",
        "result": "Correct" if is_correct else "Wrong"
    })

@api_view(["GET"])
def mcq_results_api(request):
    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)

        cur.execute("""
            SELECT 
                u.username,
                q.question,
                a.selected_answer,
                a.is_correct
            FROM mcq_answers a
            JOIN mcq_questions q ON a.mcq_id = q.mcq_id
            JOIN users1 u ON a.student_id = u.user_id
            ORDER BY a.answered_at DESC
        """)

        results = cur.fetchall()

    return Response({"results": results})

@api_view(["GET"])
def parent_search_child_api(request):
    name = request.GET.get("name")

    if not name:
        return Response({"children": []})

    con = get_db_connection()
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)

        cur.execute("""
            SELECT 
                u.user_id AS student_id,
                u.username,
                u.email,
                u.mobile
            FROM users1 u
            WHERE u.role='student'
              AND u.username LIKE %s
        """, (f"%{name}%",))

        students = cur.fetchall()

    return Response({"children": students})
