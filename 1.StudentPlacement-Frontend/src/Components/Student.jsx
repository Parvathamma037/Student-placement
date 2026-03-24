import "./Student.css";
import axios from "axios";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const Student = () => {
  const [student, setStudent] = useState(null);
  const [section, setSection] = useState("profile");

  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);

  // MCQ STATES
  const [mcqs, setMcqs] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState({});
  const [result, setResult] = useState({});

  const username = localStorage.getItem("username");

  // ---------------- LOAD STUDENT ----------------
  const loadStudent = async () => {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/student/details/?username=${username}`
    );
    setStudent(res.data.student);
  };

  const loadAttendance = async () => {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/student/attendance/?username=${username}`
    );
    setAttendance(res.data.attendance || []);
  };

  // ✅ LOAD MCQs
  const loadMcqs = async () => {
    const res = await axios.get("http://127.0.0.1:8000/api/mcq/list/");
    setMcqs(res.data.mcqs || []);
  };

  // ✅ MCQ-BASED GRADES
  const loadGrades = async () => {
    const res = await axios.get("http://127.0.0.1:8000/api/mcq/results/");

    const userResults = res.data.results.filter(
      (r) => r.username === username
    );

    let correct = 0;
    let wrong = 0;

    userResults.forEach((r) => {
      r.is_correct ? correct++ : wrong++;
    });

    let grade = "Fail";
    if (correct >= 8) grade = "A";
    else if (correct >= 5) grade = "B";
    else if (correct >= 3) grade = "C";

    setGrades([
      {
        assignment_title: "MCQ Test",
        marks: correct,
        feedback: `Wrong: ${wrong} | Grade: ${grade}`,
      },
    ]);
  };

  // ✅ SUBMIT MCQ ANSWER
  const submitMcq = async (mcq_id) => {
    if (!selectedAnswer[mcq_id]) {
      alert("Please select an answer");
      return;
    }

    const res = await axios.post(
      "http://127.0.0.1:8000/api/mcq/submit/",
      {
        username,
        mcq_id,
        selected_answer: selectedAnswer[mcq_id],
      }
    );

    setResult({
      ...result,
      [mcq_id]: res.data.result,
    });

    loadGrades(); // refresh grades after submit
  };

  useEffect(() => {
    loadStudent();
    loadAttendance();
    loadMcqs();
    loadGrades();
  }, []);

  return (
    <>
      <header>
        <div id="brand-name">
          <h1>Student Placement Preparation Hub</h1>
        </div>
        <div className="components">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/login">Logout</NavLink>
        </div>
      </header>

      <main>
        <div className="user-layout">
          {/* SIDEBAR */}
          <aside className="user-sidebar">
            <button onClick={() => setSection("profile")}>My Profile</button>
            <button onClick={() => setSection("attendance")}>My Attendance</button>
            <button onClick={() => setSection("mcq")}>MCQ Test</button>
            <button onClick={() => setSection("grades")}>My Grades</button>
         
          </aside>

          {/* CONTENT */}
          <section className="user-content">

            {/* PROFILE */}
            {section === "profile" && student && (
              <div className="user-box">
                <h2>My Profile</h2>
                <table className="user-table">
                  <tbody>
                    <tr><th>Username</th><td>{student.username}</td></tr>
                    <tr><th>Email</th><td>{student.email}</td></tr>
                    <tr><th>Mobile</th><td>{student.mobile}</td></tr>
                    <tr><th>Address</th><td>{student.address}</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ATTENDANCE */}
            {section === "attendance" && (
              <div className="user-box">
                <h2>My Attendance</h2>
                <table className="user-table">
                  <thead>
                    <tr><th>Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {attendance.map((a, i) => (
                      <tr key={i}>
                        <td>{a.date}</td>
                        <td>{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* GRADES (MCQ BASED) */}
            {section === "grades" && (
              <div className="user-box">
                <h2>My Grades</h2>
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Assignment</th>
                      <th>Marks</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g, i) => (
                      <tr key={i}>
                        <td>{g.assignment_title}</td>
                        <td>{g.marks}</td>
                        <td>{g.feedback}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MCQ TEST */}
            {section === "mcq" && (
              <div className="user-box">
                <h2>MCQ Test</h2>

                {mcqs.map((m, i) => (
                  <div key={i} className="mcq-box">
                    <p><b>Q{i + 1}.</b> {m.question}</p>

                    <div className="mcq-options">
                      {["A", "B", "C", "D"].map((opt) => (
                        <label key={opt} className="mcq-option">
                          <input
                            type="radio"
                            name={`mcq-${m.mcq_id}`}
                            onChange={() =>
                              setSelectedAnswer({
                                ...selectedAnswer,
                                [m.mcq_id]: opt,
                              })
                            }
                          />
                          {m[`option_${opt.toLowerCase()}`]}
                        </label>
                      ))}
                    </div>

                    <button onClick={() => submitMcq(m.mcq_id)}>
                      Submit Answer
                    </button>

                    {result[m.mcq_id] && (
                      <p>
                        Result:{" "}
                        <b style={{ color: result[m.mcq_id] === "Correct" ? "green" : "red" }}>
                          {result[m.mcq_id]}
                        </b>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

          </section>
        </div>
      </main>

      <footer>
        <h4>© 2025 All Rights Reserved SAK Informatics</h4>
      </footer>
    </>
  );
};

export default Student;
