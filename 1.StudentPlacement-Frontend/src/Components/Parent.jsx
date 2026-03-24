import "./Parent.css";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

const Parent = () => {
  const [parent, setParent] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");

  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  const [searchName, setSearchName] = useState("");
const [searchResult, setSearchResult] = useState([]);

  // LOAD PARENT
  const loadParent = async () => {
    const username = localStorage.getItem("username");
    const res = await axios.get(
      `http://127.0.0.1:8000/api/parentdetails/?username=${username}`
    );
    setParent(res.data.parent);
  };

  // LOAD CHILDREN
  const loadChildren = async () => {
    const res = await axios.get(
      "http://127.0.0.1:8000/api/parent/children/"
    );
    setChildren(res.data.children || []);
  };

  // LOAD ATTENDANCE
  const loadAttendance = async (student_id) => {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/parent/child-attendance/?student_id=${student_id}`
    );
    setAttendance(res.data.attendance || []);
  };

  // ✅ LOAD MCQ-BASED GRADES
  const loadGrades = async (studentUsername) => {
    const res = await axios.get(
      "http://127.0.0.1:8000/api/mcq/results/"
    );

    const studentResults = res.data.results.filter(
      (r) => r.username === studentUsername
    );

    let correct = 0;
    let wrong = 0;

    studentResults.forEach((r) => {
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

  const searchChild = async () => {
  if (!searchName.trim()) {
    alert("Enter student name");
    return;
  }

  const res = await axios.get(
    `http://127.0.0.1:8000/api/parent/search-child/?name=${searchName}`
  );

  setSearchResult(res.data.children || []);
};


  useEffect(() => {
    loadParent();
    loadChildren();
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
        <div className="staff-layout2">

          {/* SIDEBAR */}
          <aside className="sidebar2">
            <button
              className={activeSection === "profile" ? "active" : ""}
              onClick={() => setActiveSection("profile")}
            >
              My Profile
            </button>

            <button
              className={activeSection === "children" ? "active" : ""}
              onClick={() => setActiveSection("children")}
            >
              My Children
            </button>

            <button
              className={activeSection === "childAttendance" ? "active" : ""}
              onClick={() => setActiveSection("childAttendance")}
            >
              Child Attendance
            </button>

            <button
              className={activeSection === "childGrades" ? "active" : ""}
              onClick={() => setActiveSection("childGrades")}
            >
              Child Grade
            </button>
          </aside>

          {/* CONTENT */}
          <section className="staff-content">

            {/* PROFILE */}
            {activeSection === "profile" && parent && (
              <div className="section-box2">
                <h2>My Profile</h2>
                <table id="provider-table">
                  <tbody>
                    <tr><th>Parent name</th><td>{parent.username}</td></tr>
                    <tr><th>Password</th><td>{parent.password}</td></tr>
                    <tr><th>Email</th><td>{parent.email}</td></tr>
                    <tr><th>Mobile</th><td>{parent.mobile}</td></tr>
                    <tr><th>Address</th><td>{parent.address}</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* CHILDREN */}
           {activeSection === "children" && (
  <div className="section-box2">
    <h2>My Children</h2>

    {/* ✅ SEARCH BAR */}
    <div style={{ textAlign: "center", marginBottom: "1rem" }}>
      <input
        type="text"
        placeholder="Enter student name"
        value={searchName}
        onChange={(e) => setSearchName(e.target.value)}
        style={{ padding: "6px", width: "200px" }}
      />
      <button
        className="progress-btn"
        style={{ marginLeft: "10px" }}
        onClick={searchChild}
      >
        Search
      </button>
    </div>

    {/* ✅ RESULT TABLE */}
    <table id="provider-table">
      <thead>
        <tr>
          <th>Student name</th>
          <th>Email</th>
          <th>Mobile</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        {searchResult.length === 0 ? (
          <tr>
            <td colSpan="4" style={{ textAlign: "center" }}>
              No student found
            </td>
          </tr>
        ) : (
          searchResult.map((c, i) => (
            <tr key={i}>
              <td>{c.username}</td>
              <td>{c.email}</td>
              <td>{c.mobile}</td>
              <td>
                <button
                  className="progress-btn"
                  onClick={() => {
                    setSelectedChild(c);
                    loadAttendance(c.student_id);
                    loadGrades(c.username);
                    setActiveSection("childProgress");
                  }}
                >
                  Progress
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}


            {/* CHILD PROGRESS */}
            {activeSection === "childProgress" && selectedChild && (
              <div className="section-box2">
                <h2>{selectedChild.username}'s Progress</h2>

                <h3 style={{ textAlign: "center", padding: "1rem" }}>
                  Attendance
                </h3>

                {attendance.length === 0 ? (
                  <p>No attendance records found.</p>
                ) : (
                  <table id="provider-table">
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
                )}

                <h3 style={{ textAlign: "center", padding: "1rem" }}>
                  Grade
                </h3>

                <table id="provider-table">
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

            {/* CHILD ATTENDANCE */}
            {activeSection === "childAttendance" && selectedChild && (
              <div className="section-box2">
                <h2>{selectedChild.username}'s Attendance</h2>

                <table id="provider-table">
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

            {/* CHILD GRADES */}
            {activeSection === "childGrades" && selectedChild && (
              <div className="section-box2">
                <h2>{selectedChild.username}'s Grade</h2>

                <table id="provider-table">
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

          </section>
        </div>
      </main>

      <footer>
        <h4>© 2025 All Rights Reserved SAK Informatics</h4>
      </footer>
    </>
  );
};

export default Parent;
