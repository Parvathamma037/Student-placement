import "./Teacher.css";
import axios from "axios";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const Teacher = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const [student, setStudent] = useState([]);
  const [parent, setParent] = useState([]);
  const [mcqResults, setMcqResults] = useState([]);

  const [mcq, setMcq] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
  });

  // ---------------- LOAD DATA ----------------
  useEffect(() => {
    loadStudents();
    loadParent();
  }, []);

  useEffect(() => {
    if (activeSection === "mcqResults" || activeSection === "grades") {
      loadMcqResults();
    }
  }, [activeSection]);

  const loadStudents = async () => {
    const res = await axios.get("http://127.0.0.1:8000/api/teacher/student/");
    setStudent(res.data.student || []);
  };

  const loadParent = async () => {
    const res = await axios.get("http://127.0.0.1:8000/api/teacher/parent/");
    setParent(res.data.parent || []);
  };

  const loadMcqResults = async () => {
    const res = await axios.get("http://127.0.0.1:8000/api/mcq/results/");
    setMcqResults(res.data.results || []);
  };

  // ---------------- ACTIONS ----------------
  const approveUser = async (username) => {
    await axios.post("http://127.0.0.1:8000/api/approve/student/", { username });
    loadStudents();
  };

  const approveParent = async (username) => {
    await axios.post("http://127.0.0.1:8000/api/approve/parent/", { username });
    loadParent();
  };

  const markAttendance = async (username) => {
    const status = document.getElementById(`att-${username}`).value;

    await axios.post("http://127.0.0.1:8000/api/attendance/mark/", {
      student: username,
      date: new Date().toISOString().split("T")[0],
      status,
      teacher: "teacher",
    });

    alert("Attendance saved");
  };

  const addMcq = async (e) => {
    e.preventDefault();

    await axios.post("http://127.0.0.1:8000/api/mcq/add/", {
      ...mcq,
      teacher: "teacher",
    });

    alert("MCQ added successfully");

    setMcq({
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
    });
  };

  // ---------------- MCQ SUMMARY ----------------
  const mcqSummary = mcqResults.reduce((acc, row) => {
    if (!acc[row.username]) {
      acc[row.username] = { correct: 0, wrong: 0 };
    }
    row.is_correct
      ? acc[row.username].correct++
      : acc[row.username].wrong++;
    return acc;
  }, {});

  const calculateGrade = (correct) => {
    if (correct >= 8) return "A";
    if (correct >= 5) return "B";
    if (correct >= 3) return "C";
    return "Fail";
  };

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
        <div className="adminPage-layout">
          
          {/* SIDEBAR */}
          <aside className="adminPage-sidebar">
            {["dashboard","students","parent","attendance","mocktest","grades","mcqResults"].map(sec => (
              <button
                key={sec}
                className={activeSection === sec ? "active" : ""}
                onClick={() => setActiveSection(sec)}
              >
                {sec === "mcqResults"
                  ? "MCQ Results"
                  : sec.charAt(0).toUpperCase() + sec.slice(1)}
              </button>
            ))}
          </aside>

          {/* CONTENT */}
          <section className="adminPage-content">

            {/* DASHBOARD */}
            {activeSection === "dashboard" && (
              <>
                <h2>Teacher Dashboard</h2>
                <div className="adminPage-cards">
                  <div className="adminPage-card">
                    <h3>Total Students</h3>
                    <p>{student.length}</p>
                  </div>
                  <div className="adminPage-card">
                    <h3>Total Parents</h3>
                    <p>{parent.length}</p>
                  </div>
                </div>
              </>
            )}

            {/* STUDENTS */}
            {activeSection === "students" && (
              <table className="adminPage-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {student.map((s, i) => (
                    <tr key={i}>
                      <td>{s.username}</td>
                      <td>{s.email}</td>
                      <td>
                        {s.approved === 0
                          ? <button className="adminPage-approveBtn" onClick={() => approveUser(s.username)}>Approve</button>
                          : "Approved"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* PARENTS */}
            {activeSection === "parent" && (
              <table className="adminPage-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {parent.map((p, i) => (
                    <tr key={i}>
                      <td>{p.username}</td>
                      <td>{p.email}</td>
                      <td>
                        {p.approved === 0
                          ? <button className="adminPage-approveBtn" onClick={() => approveParent(p.username)}>Approve</button>
                          : "Approved"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ATTENDANCE */}
            {activeSection === "attendance" && (
              <table className="adminPage-table">
                <thead>
                  <tr><th>Student</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {student.map((s, i) => (
                    <tr key={i}>
                      <td>{s.username}</td>
                      <td>
                        <select id={`att-${s.username}`}>
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                        </select>
                      </td>
                      <td>
                        <button className="adminPage-approveBtn" onClick={() => markAttendance(s.username)}>Save</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* MOCKTEST */}
            {activeSection === "mocktest" && (
              <>
                <h3 id="center">MCQ Assignment</h3>
                <form className="assignment-form" onSubmit={addMcq}>
                  <textarea placeholder="Question" value={mcq.question}
                    onChange={(e) => setMcq({ ...mcq, question: e.target.value })} />
                  <input placeholder="Option A" value={mcq.optionA}
                    onChange={(e) => setMcq({ ...mcq, optionA: e.target.value })} />
                  <input placeholder="Option B" value={mcq.optionB}
                    onChange={(e) => setMcq({ ...mcq, optionB: e.target.value })} />
                  <input placeholder="Option C" value={mcq.optionC}
                    onChange={(e) => setMcq({ ...mcq, optionC: e.target.value })} />
                  <input placeholder="Option D" value={mcq.optionD}
                    onChange={(e) => setMcq({ ...mcq, optionD: e.target.value })} />
                  <select onChange={(e) => setMcq({ ...mcq, correctAnswer: e.target.value })}>
                    <option value="">Correct Answer</option>
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                  <button className="adminPage-approveBtn">Add MCQ</button>
                </form>
              </>
            )}

            {/* GRADES (MCQ BASED) */}
            {activeSection === "grades" && (
              <>
                <h2>Grades (Based on MCQ Performance)</h2>
                <table className="adminPage-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Correct</th>
                      <th>Wrong</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(mcqSummary).map((u, i) => (
                      <tr key={i}>
                        <td>{u}</td>
                        <td>{mcqSummary[u].correct}</td>
                        <td>{mcqSummary[u].wrong}</td>
                        <td>{calculateGrade(mcqSummary[u].correct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* MCQ RESULTS SUMMARY */}
            {activeSection === "mcqResults" && (
              <>
                <h2>MCQ Performance Summary</h2>
                <table className="adminPage-table">
                  <thead>
                    <tr><th>Student</th><th>Correct</th><th>Wrong</th></tr>
                  </thead>
                  <tbody>
                    {Object.keys(mcqSummary).map((u, i) => (
                      <tr key={i}>
                        <td>{u}</td>
                        <td>{mcqSummary[u].correct}</td>
                        <td>{mcqSummary[u].wrong}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
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

export default Teacher;
