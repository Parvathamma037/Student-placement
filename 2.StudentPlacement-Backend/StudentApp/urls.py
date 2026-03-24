from django.urls import path
from .views import*

urlpatterns = [
    # Authentication
    path("register/", register_api),
    path("login/", login_api),

    # User Details
    path("student/", student_page_api),
    path("studentdetails/", student_details_api),
    path("parentdetails/", parent_details_api),

    # Admin
    path("teacher/", teacher_page_api),
    path("teacher/student/",teacher_student_api),
    path("teacher/parent/", teacher_parent_api),
    path("approve/student/", approve_student_api),
    path("approve/parent/", approve_parent_api),

    path("attendance/mark/", mark_attendance_api),

    # ASSIGNMENTS
    path("assignment/add/", add_assignment_api),

    # GRADES
    path("grades/give/", give_grade_api),

    path("student/details/", student_details_api),
    path("student/attendance/", student_attendance_api),
    path("student/assignments/", student_assignments_api),
    path("student/submit-assignment/", student_submit_assignment_api),
    path("student/grades/", student_grades_api),
    
    path("parent/children/", parent_children_api),
    path("parent/child-attendance/", parent_child_attendance_api),
    path("parent/child-grades/", parent_child_grades_api),

   path("mcq/add/", add_mcq_api),
   path("mcq/list/", student_view_mcq_api),
   path("mcq/submit/", submit_mcq_api),
   path("mcq/results/", mcq_results_api), 
   
   path("parent/search-child/", parent_search_child_api),


]
