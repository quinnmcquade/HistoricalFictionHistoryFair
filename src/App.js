import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  collection,
  deleteDoc,
} from "firebase/firestore";
import {
  Library,
  FileCheck,
  Quote,
  Bookmark,
  Landmark,
  CheckCircle2,
  Database,
  Trash2,
  Plus,
  MessageSquare,
  Users,
  CalendarDays,
  Clock,
  Cloud,
  Share2,
  BookOpen,
  Info,
  LayoutDashboard,
  GraduationCap,
  ChevronRight,
  User,
  School,
  Filter,
  Eye,
  FileText,
  History,
  UserCircle,
  ArrowRight,
  Target,
  Search,
  RefreshCw,
  Fingerprint,
  Link2,
  AlertCircle,
} from "lucide-react";
import PDFExport from "./PDFExport.jsx";
import PINModal from "./PINModal.jsx";
// Polyfill for process.env which is required by some Firebase internals
if (typeof window !== "undefined" && !window.process) {
  window.process = { env: {} };
}

// --- Firebase Configuration ---
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : {
        apiKey: "AIzaSyAmBrF4QL7RUDasZERxG6Kg9tJQt5aGtQY",
        authDomain: "nonfiction-history-fair.firebaseapp.com",
        projectId: "nonfiction-history-fair",
        storageBucket: "nonfiction-history-fair.firebasestorage.app",
        messagingSenderId: "980220745532",
        appId: "1:980220745532:web:7e8ceba0f51f6194827039",
      };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId =
  typeof __app_id !== "undefined" ? __app_id : "history-research-log-v4";

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("intro");
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewMode, setViewMode] = useState("student");
  const [allStudentsData, setAllStudentsData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);
  const [isPINCorrect, setIsPINCorrect] = useState(false);
  const CORRECT_PIN = "1999";
  const classrooms = [
    "Miss Campbell",
    "Mrs. Higginbotham",
    "Mr. McQuade",
    "Ms. Smith",
  ];

  const [researchData, setResearchData] = useState({
    studentName: "",
    classroom: classrooms[0],
    teacherName: "",
    bookTitle: "", // Changed from topic
    author: "", // New field
    setting: "", // Changed from context
    historicalAccuracy: "", // Changed from importance
    mainTheme: "", // Changed from thesis
    characters: [{ id: 1, name: "", role: "Protagonist", description: "" }], // Renamed from people
    plotPoints: [{ id: 1, chapter: "", event: "", emotionalImpact: "" }], // Renamed from timeline
    periodDetails: [{ id: 1, detail: "", page: "", actualHistory: "" }], // Renamed from evidence
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth failed", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    // Check if PIN was already verified on this device
    const isPINVerified = localStorage.getItem("teacherPINVerified") === "true";
    setIsPINCorrect(isPINVerified);
  }, []);
  useEffect(() => {
    if (!user || viewMode === "teacher") return;
    const docRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "research",
      "main"
    );
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setResearchData(docSnap.data());
        }
      },
      (error) => console.error("Firestore sync error:", error)
    );
    return () => unsubscribe();
  }, [user, viewMode]);

  useEffect(() => {
    if (!user || viewMode !== "teacher") return;
    const publicRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "student_logs"
    );
    const unsubscribe = onSnapshot(
      publicRef,
      (snapshot) => {
        const students = [];
        snapshot.forEach((doc) => {
          students.push({ id: doc.id, ...doc.data() });
        });
        setAllStudentsData(students);
      },
      (error) => console.error("Teacher dashboard sync error:", error)
    );
    return () => unsubscribe();
  }, [user, viewMode]);

  const saveToCloud = async (newData) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const privateRef = doc(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "research",
        "main"
      );
      await setDoc(privateRef, newData);

      const publicRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "student_logs",
        user.uid
      );
      await setDoc(publicRef, {
        ...newData,
        lastUpdated: new Date().toISOString(),
        uid: user.uid,
      });
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };
  const handlePINSubmit = (enteredPIN) => {
    if (enteredPIN === CORRECT_PIN) {
      setIsPINCorrect(true);
      localStorage.setItem("teacherPINVerified", "true"); // SAVE TO DEVICE
      setShowPINModal(false);
    } else {
      alert("Incorrect PIN. Access denied.");
      setShowPINModal(false);
    }
  };
  const handleDeleteStudent = async (studentId) => {
    // Confirm deletion
    const confirmed = window.confirm(
      "Are you sure you want to delete this student's work? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      setIsSyncing(true);

      // Delete from public logs
      const publicRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "student_logs",
        studentId
      );
      await deleteDoc(publicRef);

      // Clear selected student
      setSelectedStudent(null);

      alert("Student record deleted successfully.");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete student record. Please try again.");
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const tabs = [
    {
      id: "intro",
      label: "01. Introduction", // Was "01. The Book"
      icon: BookOpen,
      desc: "Core Details",
    },
    {
      id: "characters",
      label: "2. Characters",
      icon: Users,
      desc: "Key Figures",
    },
    { id: "plot", label: "3. Key Events", icon: History, desc: "Plot Journey" },
    {
      id: "history",
      label: "4. Historical Accuracy",
      icon: Landmark,
      desc: "Accurate Events",
    },
    { id: "theme", label: "5. Theme", icon: Target, desc: "The Big Idea" },
  ];

  const updateField = (field, value) => {
    const updated = { ...researchData, [field]: value };
    setResearchData(updated);
    saveToCloud(updated);
  };

  const addRow = (type) => {
    const templates = {
      characters: {
        id: Date.now(),
        name: "",
        role: "Protagonist",
        description: "",
      },
      plotPoints: {
        id: Date.now(),
        chapter: "",
        event: "",
        emotionalImpact: "",
      },
      periodDetails: {
        id: Date.now(),
        detail: "",
        page: "",
        actualHistory: "",
      },
    };
    const updated = {
      ...researchData,
      [type]: [...(researchData[type] || []), templates[type]],
    };
    setResearchData(updated);
    saveToCloud(updated);
  };

  const deleteRow = (type, id) => {
    const updated = {
      ...researchData,
      [type]: researchData[type].filter((item) => item.id !== id),
    };
    setResearchData(updated);
    saveToCloud(updated);
  };

  const updateRow = (type, id, field, value) => {
    const updated = {
      ...researchData,
      [type]: researchData[type].map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    };
    setResearchData(updated);
    saveToCloud(updated);
  };

  const getProgress = (data) => {
    if (!data) return 0;
    let score = 0;
    if (data.bookTitle) score += 20;
    if (data.author) score += 20;
    if (data.characters?.filter((c) => c.name).length > 0) score += 20;
    if (data.plotPoints?.filter((p) => p.event).length > 0) score += 20;
    if (data.mainTheme) score += 20;
    return Math.min(score, 100);
  };
  // 1. Filter the students based on the selected classroom
  const filteredStudents = React.useMemo(() => {
    if (teacherFilter === "all") return allStudentsData;

    return allStudentsData.filter((s) => {
      // Standardize classroom names to avoid casing/spacing issues
      const studentRoom = s.classroom?.trim();
      const filterRoom = teacherFilter.trim();
      return studentRoom === filterRoom;
    });
  }, [allStudentsData, teacherFilter]);

  // 2. Add a helper to group students by classroom for easier viewing
  const studentsByClass = (room) =>
    allStudentsData.filter((s) => s.classroom === room).length;
  return (
    <>
      <div className="min-h-screen bg-[#fcfdfa] text-slate-900 font-sans p-4 md:p-8">
        {/* Top Navigation Bar */}
        <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-blue-100/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight italic">
                Historical Fiction Journal
              </h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600/80">
                History Fair Project
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <button
              onClick={() => {
                setViewMode("student");
                // DON'T clear the PIN - keep them verified for this session
              }}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 ${
                viewMode === "student"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <User className="w-4 h-4" /> Student Portal
            </button>
            <button
              onClick={() => {
                if (isPINCorrect) {
                  setViewMode("teacher");
                } else {
                  setShowPINModal(true);
                }
              }}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 ${
                viewMode === "teacher"
                  ? "bg-slate-800 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Faculty Dashboard
            </button>
          </div>
        </div>

        {viewMode === "teacher" ? (
          /* --- TEACHER DASHBOARD --- */
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[800px]">
              <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/20 flex flex-col overflow-hidden">
                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">
                      Student Projects
                    </h2>
                    <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-[10px] font-black uppercase">
                      {filteredStudents.length} Records
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTeacherFilter("all")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        teacherFilter === "all"
                          ? "bg-slate-800 text-white shadow-md"
                          : "bg-white text-slate-500 border"
                      }`}
                    >
                      All Classes
                    </button>
                    {classrooms.map((room) => (
                      <button
                        key={room}
                        onClick={() => setTeacherFilter(room)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          teacherFilter === room
                            ? "bg-slate-800 text-white shadow-md"
                            : "bg-white text-slate-500 border"
                        }`}
                      >
                        {room}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {filteredStudents.length === 0 ? (
                    <div className="p-10 text-center">
                      <p className="text-sm text-slate-400 font-medium">
                        No student records found for this filter.
                      </p>
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`w-full text-left p-5 border-b border-slate-50 flex items-center justify-between transition-all group ${
                          selectedStudent?.id === student.id
                            ? "bg-blue-50/50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                              selectedStudent?.id === student.id
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {student.studentName?.charAt(0) || "A"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-none mb-1 group-hover:text-blue-600 transition-colors">
                              {student.studentName || "Anonymous Student"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {student.classroom}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-xs font-black text-blue-600 mb-1">
                            {getProgress(student)}%
                          </div>
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600"
                              style={{ width: `${getProgress(student)}%` }}
                            ></div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/20 flex flex-col overflow-hidden relative">
                {!selectedStudent ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-[#fdfdfd]">
                    <div className="bg-slate-50 p-6 rounded-full mb-4">
                      <Search className="w-12 h-12 text-slate-200" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-400">
                      Select a student record to review
                    </h3>
                    <p className="text-sm text-slate-300">
                      Detailed historical logs will appear here
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-start shrink-0 bg-white z-10 sticky top-0">
                      <div className="flex-1">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-start shrink-0 bg-white z-10 sticky top-0">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                              <FileText className="w-3 h-3" /> Historical
                              Portfolio Dossier
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">
                              {selectedStudent.studentName || "Anonymous"}
                            </h2>
                            <p className="text-blue-800 font-medium italic text-lg opacity-80 leading-tight">
                              "{selectedStudent.bookTitle || "Untitled Book"}"
                              by {selectedStudent.author || "Unknown Author"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => setShowPDFExport(true)}
                                className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
                              >
                                <FileText className="w-4 h-4" /> Export to PDF
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteStudent(selectedStudent.uid)
                                }
                                className="px-6 py-3 rounded-2xl bg-red-100 text-red-700 font-bold text-sm hover:bg-red-200 transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
                              >
                                <Trash2 className="w-4 h-4" /> Delete Record
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                                Archive ID
                              </p>
                              <p className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border">
                                {selectedStudent.uid?.substring(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-blue-800 font-medium italic text-lg opacity-80 leading-tight">
                          "{selectedStudent.bookTitle || "Untitled Book"}" by{" "}
                          {selectedStudent.author || "Unknown Author"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                          Archive ID
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border">
                          {selectedStudent.uid?.substring(0, 8)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-slate-50/30 custom-scrollbar pb-24">
                      {/* section: Argument */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-blue-100 pb-2">
                          <Target className="w-5 h-5 text-blue-600" />
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                            The Argument (Thesis)
                          </h3>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border-2 border-blue-100 shadow-sm relative overflow-hidden">
                          <Quote className="absolute -top-2 -left-2 w-20 h-20 text-blue-50 opacity-[0.05]" />
                          <p className="text-xl font-serif text-slate-800 italic leading-relaxed relative z-10">
                            {selectedStudent.mainTheme ||
                              "No thesis statement drafted yet."}
                          </p>
                        </div>
                      </section>

                      {/* section: Historical Setting */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-600" />
                          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                            Historical Setting
                          </h4>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-sm text-slate-600 leading-relaxed min-h-[120px]">
                          {selectedStudent.setting || "Pending research..."}
                        </div>
                      </section>

                      {/* section: Book Info */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-blue-100 pb-2">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                            Book Information
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-2xl border border-slate-100">
                            <h5 className="font-bold text-slate-900 text-sm mb-2">
                              Title
                            </h5>
                            <p className="text-sm text-slate-600">
                              {selectedStudent.bookTitle || "Not provided"}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100">
                            <h5 className="font-bold text-slate-900 text-sm mb-2">
                              Author
                            </h5>
                            <p className="text-sm text-slate-600">
                              {selectedStudent.author || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </section>

                      {/* section: Timeline */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-blue-100 pb-2">
                          <CalendarDays className="w-5 h-5 text-blue-600" />
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                            Chronological Chain
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {selectedStudent.plotPoints?.filter((p) => p.event)
                            .length > 0 ? (
                            selectedStudent.plotPoints
                              .filter((p) => p.event)
                              .map((item) => (
                                <div key={item.id} className="flex gap-4">
                                  <div className="shrink-0 w-24 text-right">
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                      {item.chapter || "TBD"}
                                    </span>
                                  </div>
                                  <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 text-sm text-slate-700">
                                    {item.event}
                                  </div>
                                </div>
                              ))
                          ) : (
                            <p className="text-xs text-slate-400 italic py-4">
                              No timeline events logged.
                            </p>
                          )}
                        </div>
                      </section>

                      {/* section: Key Figures */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-blue-100 pb-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                            Important Characters
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedStudent.characters?.filter((c) => c.name)
                            .length > 0 ? (
                            selectedStudent.characters
                              .filter((c) => c.name)
                              .map((person) => (
                                <div
                                  key={person.id}
                                  className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4"
                                >
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <UserCircle className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-slate-800 text-sm">
                                      {person.name}
                                    </h5>
                                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                                      {person.description ||
                                        "No description provided."}
                                    </p>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <p className="text-xs text-slate-400 italic py-4">
                              No key figures identified.
                            </p>
                          )}
                        </div>
                      </section>

                      {/* section: Historical Accuracy Details */}
                      <section className="space-y-6 pb-12">
                        <div className="flex items-center gap-3 border-b border-blue-100 pb-2">
                          <Quote className="w-5 h-5 text-blue-600" />
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                            Historical Accuracy Details
                          </h3>
                        </div>
                        <div className="space-y-6">
                          {selectedStudent.periodDetails?.filter(
                            (d) => d.detail
                          ).length > 0 ? (
                            selectedStudent.periodDetails
                              .filter((d) => d.detail)
                              .map((item) => (
                                <div
                                  key={item.id}
                                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
                                >
                                  <div className="text-sm font-medium text-slate-700 pl-4 border-l-4 border-blue-600/20">
                                    "{item.detail}"
                                  </div>
                                  {item.actualHistory && (
                                    <div className="bg-blue-50/50 p-4 rounded-2xl text-[11px] text-blue-800 leading-relaxed">
                                      <span className="font-black uppercase tracking-tighter mr-2">
                                        Historical Context:
                                      </span>
                                      {item.actualHistory}
                                    </div>
                                  )}
                                </div>
                              ))
                          ) : (
                            <p className="text-xs text-slate-400 italic py-4">
                              No historical details logged.
                            </p>
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* --- STUDENT VIEW --- */
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 animate-in fade-in duration-700">
            {/* Progress Sidebar */}
            <aside className="lg:w-80 flex flex-col gap-6 shrink-0">
              <div className="bg-white p-6 rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-900/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Database className="w-20 h-20 text-blue-900" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 text-center">
                    Journal Status
                  </h3>
                  <div className="mb-8 px-4">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-4xl font-black text-blue-600">
                        {getProgress(researchData)}%
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        Complete
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div
                        className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-1000 ease-out"
                        style={{ width: `${getProgress(researchData)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 group ${
                            isActive
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 translate-x-1"
                              : "text-slate-500 hover:bg-blue-50"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl ${
                              isActive
                                ? "bg-white/20"
                                : "bg-slate-100 group-hover:bg-blue-100"
                            }`}
                          >
                            <tab.icon
                              className={`w-4 h-4 ${
                                isActive
                                  ? "text-white"
                                  : "text-slate-500 group-hover:text-blue-600"
                              }`}
                            />
                          </div>
                          <div className="text-left">
                            <p
                              className={`text-xs font-bold leading-none mb-1 ${
                                isActive ? "text-white" : "text-slate-800"
                              }`}
                            >
                              {tab.label.split(".")[1]}
                            </p>
                            <p
                              className={`text-[9px] uppercase tracking-tighter font-medium ${
                                isActive ? "text-blue-100" : "text-slate-400"
                              }`}
                            >
                              {tab.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Editing Content */}
            <main className="flex-1 flex flex-col gap-6">
              <div className="bg-white rounded-[2.5rem] border border-blue-100 shadow-2xl shadow-blue-900/5 p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-800"></div>

                {/* 1. INTRODUCTION (Updated) */}
                {activeTab === "intro" && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">
                          Introduction
                        </h2>
                        <p className="text-slate-500 text-sm">
                          Identify yourself and the primary details of your
                          selection.
                        </p>
                      </div>
                    </div>

                    {/* Identification Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">
                          Student Name
                        </label>
                        <input
                          className="w-full p-5 rounded-3xl border border-slate-100 bg-slate-50/50 outline-none text-lg focus:ring-2 focus:ring-blue-600/20 transition-all"
                          value={researchData.studentName || ""}
                          onChange={(e) =>
                            updateField("studentName", e.target.value)
                          }
                          placeholder="Your Full Name"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">
                          Assigning Teacher
                        </label>
                        <select
                          className="w-full p-5 rounded-3xl border border-slate-100 bg-slate-50/50 outline-none text-lg appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600/20 transition-all"
                          value={researchData.classroom || ""}
                          onChange={(e) =>
                            updateField("classroom", e.target.value)
                          }
                        >
                          <option value="">Select Teacher...</option>
                          {classrooms.map((room) => (
                            <option key={room} value={room}>
                              {room}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Book Details Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-50 pt-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">
                          Book Title
                        </label>
                        <input
                          className="w-full p-5 rounded-3xl border border-slate-100 bg-slate-50/50 outline-none text-lg"
                          value={researchData.bookTitle || ""}
                          onChange={(e) =>
                            updateField("bookTitle", e.target.value)
                          }
                          placeholder="e.g., The Book Thief"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">
                          Author
                        </label>
                        <input
                          className="w-full p-5 rounded-3xl border border-slate-100 bg-slate-50/50 outline-none text-lg"
                          value={researchData.author || ""}
                          onChange={(e) =>
                            updateField("author", e.target.value)
                          }
                          placeholder="Markus Zusak"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">
                        Historical Setting
                      </label>
                      <textarea
                        className="w-full p-5 rounded-3xl border border-slate-100 bg-slate-50/50 outline-none min-h-[120px]"
                        value={researchData.setting || ""}
                        onChange={(e) => updateField("setting", e.target.value)}
                        placeholder="Describe the time and location..."
                      />
                    </div>
                  </div>
                )}

                {/* 2. CHARACTERS (formerly CAST) */}
                {activeTab === "characters" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center">
                      <h2 className="text-4xl font-black text-slate-800 tracking-tighter">
                        The Characters
                      </h2>
                      <button
                        onClick={() => addRow("characters")}
                        className="bg-blue-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                      >
                        <Plus className="w-4 h-4" /> Add Character
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {researchData.characters.map((person) => (
                        <div
                          key={person.id}
                          className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4 relative group"
                        >
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) =>
                              updateRow(
                                "characters",
                                person.id,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Name..."
                            className="w-full p-2 bg-transparent font-black text-slate-900 text-lg outline-none"
                          />
                          <textarea
                            value={person.description}
                            onChange={(e) =>
                              updateRow(
                                "characters",
                                person.id,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Role and importance?"
                            className="w-full p-3 bg-white border border-slate-100 rounded-2xl text-xs min-h-[80px] outline-none"
                          />
                          <button
                            onClick={() => deleteRow("characters", person.id)}
                            className="absolute top-4 right-4 text-slate-200 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. NARRATIVE (PLOT) */}
                {activeTab === "plot" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center">
                      <h2 className="text-4xl font-black text-slate-800 tracking-tighter">
                        The Narrative
                      </h2>
                      <button
                        onClick={() => addRow("plotPoints")}
                        className="bg-blue-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                      >
                        <Plus className="w-4 h-4" /> New Event
                      </button>
                    </div>
                    <div className="space-y-4">
                      {researchData.plotPoints.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 bg-slate-50 border border-slate-100 rounded-3xl flex gap-4 items-center"
                        >
                          <input
                            type="text"
                            value={item.chapter}
                            onChange={(e) =>
                              updateRow(
                                "plotPoints",
                                item.id,
                                "chapter",
                                e.target.value
                              )
                            }
                            placeholder="Chap/Date"
                            className="w-24 p-3 font-black text-blue-600 bg-blue-50 rounded-xl outline-none text-center text-xs"
                          />
                          <input
                            type="text"
                            value={item.event}
                            onChange={(e) =>
                              updateRow(
                                "plotPoints",
                                item.id,
                                "event",
                                e.target.value
                              )
                            }
                            placeholder="What occurred?"
                            className="flex-1 p-3 bg-transparent font-medium text-slate-700 outline-none text-sm"
                          />
                          <button
                            onClick={() => deleteRow("plotPoints", item.id)}
                            className="p-3 mr-4 text-slate-300 hover:text-red-500 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. HISTORICAL DETAILS (HISTORY) */}
                {activeTab === "history" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center">
                      <h2 className="text-4xl font-black text-slate-800 tracking-tighter">
                        Historical Details
                      </h2>
                      <button
                        onClick={() => addRow("periodDetails")}
                        className="bg-blue-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                      >
                        <Plus className="w-4 h-4" /> Log Detail
                      </button>
                    </div>
                    <div className="space-y-6">
                      {researchData.periodDetails.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 space-y-4"
                        >
                          <div className="flex justify-between items-center">
                            <input
                              className="bg-white p-3 rounded-xl border border-slate-100 text-sm font-bold w-full"
                              placeholder="Historical detail from book..."
                              value={item.detail}
                              onChange={(e) =>
                                updateRow(
                                  "periodDetails",
                                  item.id,
                                  "detail",
                                  e.target.value
                                )
                              }
                            />
                            <button
                              onClick={() =>
                                deleteRow("periodDetails", item.id)
                              }
                              className="ml-4 text-slate-200 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            className="w-full p-4 bg-blue-900/5 border border-blue-900/10 rounded-2xl text-xs italic text-blue-800 outline-none"
                            placeholder="How does this compare to actual history?"
                            value={item.actualHistory}
                            onChange={(e) =>
                              updateRow(
                                "periodDetails",
                                item.id,
                                "actualHistory",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. THEMES */}
                {activeTab === "theme" && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter text-center">
                      Analysis & Themes
                    </h2>
                    <div className="bg-slate-900 p-1 rounded-[3rem] shadow-2xl max-w-4xl mx-auto">
                      <div className="bg-white p-10 rounded-[2.8rem] space-y-6">
                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block text-center">
                          Main Historical Argument
                        </label>
                        <textarea
                          className="w-full p-8 border-none text-2xl font-serif text-slate-800 italic leading-relaxed text-center outline-none bg-transparent"
                          placeholder="What is the big idea?"
                          value={researchData.mainTheme}
                          onChange={(e) =>
                            updateField("mainTheme", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* System Metadata Area */}
              <div className="px-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sync Status Card */}
                <div className="bg-white/60 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-4 flex items-center justify-between group hover:bg-white transition-all">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSyncing ? "bg-amber-100" : "bg-blue-100"
                      }`}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${
                          isSyncing
                            ? "text-amber-600 animate-spin"
                            : "text-blue-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                        Journal Sync Status
                      </p>
                      <p className="text-xs font-bold text-slate-700">
                        {isSyncing
                          ? "Archiving current entry..."
                          : "All changes saved to cloud"}
                      </p>
                    </div>
                  </div>
                  {!isSyncing && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  )}
                </div>

                {/* Identity Key Card */}
                <div className="bg-white/60 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 flex items-center gap-3 group hover:bg-white transition-all">
                  <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-slate-800 transition-colors">
                    <Fingerprint className="w-4 h-4 text-slate-500 group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Inquiry Identity Key
                    </p>
                    <p className="text-xs font-mono font-medium text-slate-600 truncate max-w-[180px]">
                      {user?.uid || "Authenticating..."}
                    </p>
                  </div>
                </div>
              </div>{" "}
              {/* This closes the Metadata Grid */}
            </main>
          </div>
        )}

        {/* Footer Info */}
        <footer className="max-w-7xl mx-auto mt-12 py-8 border-t border-blue-100/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400">
          <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <Database className="w-3 h-3" /> History Fair Archival System
          </p>
          <div className="flex gap-6">
            <span className="text-[10px] font-bold uppercase tracking-widest hover:text-blue-600 cursor-pointer">
              Help Center
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest hover:text-blue-600 cursor-pointer">
              Citations
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest hover:text-blue-600 cursor-pointer">
              Faculty Board
            </span>
          </div>
        </footer>
      </div>
      {showPINModal && (
        <PINModal isOpen={showPINModal} onPINSubmit={handlePINSubmit} />
      )}

      {showPDFExport && selectedStudent && (
        <PDFExport
          student={selectedStudent}
          onClose={() => setShowPDFExport(false)}
        />
      )}
      {showPDFExport && selectedStudent && (
        <PDFExport
          student={selectedStudent}
          onClose={() => setShowPDFExport(false)}
        />
      )}
    </>
  );
};

export default App;
