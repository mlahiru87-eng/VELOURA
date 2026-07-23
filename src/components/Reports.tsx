import { useState, useEffect, useRef, memo, useMemo } from "react";
import { 
  FileText, Download, Printer, Filter, Calendar, 
  ArrowRight, Search, TrendingUp, CheckCircle, AlertTriangle, Users,
  Clock, ArrowUpRight, Database, CalendarRange, Paperclip, CheckSquare, BarChart2, FileSpreadsheet
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import * as XLSX from "xlsx";
import { CallUpEntry, UserProfile, translations, ActivityLog } from "../types";

interface ReportsProps {
  user: UserProfile;
  language: 'en' | 'si';
  entries: CallUpEntry[];
  users: UserProfile[];
  activityLogs?: ActivityLog[];
}

type ReportType = 'pending' | 'completed' | 'overdue' | 'monthly' | 'performance' | 'monthlySummary';

const Reports = memo(function Reports({
  user,
  language,
  entries,
  users,
  activityLogs = []
}: ReportsProps) {
  const t = translations[language];
  const [reportType, setReportType] = useState<ReportType>('pending');
  
  // Executive Month / Year Filters
  const [selectedMonth, setSelectedMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));

  // Filters
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [officerFilter, setOfficerFilter] = useState(user.role === 'Super Admin' ? "All" : user.uid);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if ((reportType === 'performance' || reportType === 'monthlySummary') && user.role !== 'Super Admin') {
      setReportType('pending');
    }
  }, [reportType, user.role]);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Filter logic
  let filteredEntries = [...entries];
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Report Type filtering
  if (reportType === 'pending') {
    filteredEntries = filteredEntries.filter(e => e.status === 'Pending' || e.status === 'In Progress');
  } else if (reportType === 'completed') {
    filteredEntries = filteredEntries.filter(e => e.status === 'Completed');
  } else if (reportType === 'overdue') {
    filteredEntries = filteredEntries.filter(e => e.status === 'Overdue' || (e.status !== 'Completed' && e.dueDate < todayStr));
  }

  // 2. Extra Filters
  if (priorityFilter !== "All") {
    filteredEntries = filteredEntries.filter(e => e.priority === priorityFilter);
  }
  if (officerFilter !== "All") {
    filteredEntries = filteredEntries.filter(e => {
      const uids = e.responsibleOfficers || (e.responsibleOfficer ? e.responsibleOfficer.split(",") : []);
      return uids.includes(officerFilter);
    });
  }
  if (dateFrom) {
    filteredEntries = filteredEntries.filter(e => e.dateReceived >= dateFrom);
  }
  if (dateTo) {
    filteredEntries = filteredEntries.filter(e => e.dueDate <= dateTo);
  }

  // Calculate stats for Performance report
  const performanceData = users.map(u => {
    const assigned = entries.filter(e => {
      const uids = e.responsibleOfficers || (e.responsibleOfficer ? e.responsibleOfficer.split(",") : []);
      return uids.includes(u.uid);
    });
    const completed = assigned.filter(e => e.status === 'Completed').length;
    const overdue = assigned.filter(e => e.status === 'Overdue').length;
    const pending = assigned.filter(e => e.status === 'Pending' || e.status === 'In Progress').length;
    
    // Completion rate %
    const rate = assigned.length > 0 ? Math.round((completed / assigned.length) * 100) : 0;
    
    return {
      uid: u.uid,
      name: u.displayName,
      designation: u.designation || "Officer",
      department: u.department || "General",
      total: assigned.length,
      completed,
      overdue,
      pending,
      rate
    };
  });

  // ==================================================
  // EXECUTIVE MONTHLY SUMMARY CALCULATIONS (SUPER ADMIN)
  // ==================================================
  const filteredExecutiveEntries = entries.filter(e => {
    if (!e.dateReceived) return false;
    return e.dateReceived.startsWith(`${selectedYear}-${selectedMonth}`);
  });

  const exeTotalRecords = filteredExecutiveEntries.length;
  const exePending = filteredExecutiveEntries.filter(e => e.status === 'Pending' || e.status === 'In Progress').length;
  const exeCompleted = filteredExecutiveEntries.filter(e => e.status === 'Completed').length;
  const exeOverdue = filteredExecutiveEntries.filter(e => e.status === 'Overdue' || (e.status !== 'Completed' && e.dueDate < todayStr)).length;
  
  const exeTodayCompleted = entries.filter(e => e.status === 'Completed' && e.completedAt && e.completedAt.startsWith(todayStr)).length;
  const exeHighPriority = filteredExecutiveEntries.filter(e => e.priority === 'High').length;
  const exeUrgent = filteredExecutiveEntries.filter(e => e.priority === 'Urgent').length;

  let exeAverageCompletionTimeValue = 0;
  let exeAverageCompletionTime = "0.0 days";
  const exeCompletedWithTimes = filteredExecutiveEntries.filter(e => e.status === 'Completed' && e.completedAt && e.dateReceived);
  if (exeCompletedWithTimes.length > 0) {
    const totalDays = exeCompletedWithTimes.reduce((sum, e) => {
      const receiveDate = new Date(e.dateReceived);
      const compDate = new Date(e.completedAt!);
      const diffMs = compDate.getTime() - receiveDate.getTime();
      const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    exeAverageCompletionTimeValue = totalDays / exeCompletedWithTimes.length;
    exeAverageCompletionTime = `${exeAverageCompletionTimeValue.toFixed(1)} days`;
  }

  const exeTotalAttachments = filteredExecutiveEntries.reduce((sum, e) => sum + (e.attachments?.length || 0) + (e.completionAttachment ? 1 : 0), 0);
  const exeActiveUsersAdmins = users.filter(u => u.active && (u.role === 'Admin' || u.role === 'User')).length;

  // Most Active Officer
  const exeOfficerCounts: { [key: string]: number } = {};
  filteredExecutiveEntries.forEach(e => {
    const name = e.responsibleOfficerName || e.responsibleOfficer || "Unassigned";
    exeOfficerCounts[name] = (exeOfficerCounts[name] || 0) + 1;
  });
  let exeMostActiveOfficer = "N/A";
  let exeMaxOfficerCount = 0;
  Object.entries(exeOfficerCounts).forEach(([name, count]) => {
    if (count > exeMaxOfficerCount) {
      exeMaxOfficerCount = count;
      exeMostActiveOfficer = `${name} (${count} entries)`;
    }
  });

  // Most Active Office
  const exeOfficeCounts: { [key: string]: number } = {};
  filteredExecutiveEntries.forEach(e => {
    const office = e.officeInstitution || "Unknown Office";
    exeOfficeCounts[office] = (exeOfficeCounts[office] || 0) + 1;
  });
  let exeMostActiveOffice = "N/A";
  let exeMaxOfficeCount = 0;
  Object.entries(exeOfficeCounts).forEach(([office, count]) => {
    if (count > exeMaxOfficeCount) {
      exeMaxOfficeCount = count;
      exeMostActiveOffice = `${office} (${count} entries)`;
    }
  });

  // Recharts chart data for selected month
  const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
  const exeDailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const dayStr = String(i + 1).padStart(2, '0');
    const dateStr = `${selectedYear}-${selectedMonth}-${dayStr}`;
    const count = filteredExecutiveEntries.filter(e => e.dateReceived === dateStr).length;
    return {
      day: `${i + 1}`,
      Records: count
    };
  });

  const exeStatusData = [
    { name: 'Pending', value: exePending, color: '#3b82f6' },
    { name: 'Completed', value: exeCompleted, color: '#10b981' },
    { name: 'Overdue', value: exeOverdue, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const exePriorityData = [
    { name: 'Low', value: filteredExecutiveEntries.filter(e => e.priority === 'Low').length, color: '#94a3b8' },
    { name: 'Medium', value: filteredExecutiveEntries.filter(e => e.priority === 'Medium').length, color: '#10b981' },
    { name: 'High', value: filteredExecutiveEntries.filter(e => e.priority === 'High').length, color: '#f59e0b' },
    { name: 'Urgent', value: filteredExecutiveEntries.filter(e => e.priority === 'Urgent').length, color: '#ef4444' }
  ];

  const exeOfficerPerformance = users.map(u => {
    const assigned = filteredExecutiveEntries.filter(e => {
      const uids = e.responsibleOfficers || (e.responsibleOfficer ? e.responsibleOfficer.split(",") : []);
      return uids.includes(u.uid);
    });
    const completed = assigned.filter(e => e.status === 'Completed').length;
    return {
      name: u.displayName.split(' ')[0] || u.displayName,
      Assigned: assigned.length,
      Completed: completed
    };
  }).filter(o => o.Assigned > 0).slice(0, 5);

  const handleExportExecutiveExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ["Executive Monthly Report Summary"],
      [],
      ["Report Period", `${selectedYear}-${selectedMonth}`],
      ["Generated Date", new Date().toLocaleString()],
      ["Generated By", `${user.displayName} (Super Admin)`],
      [],
      ["Metric", "Value"],
      ["Total Records", exeTotalRecords],
      ["Pending Items", exePending],
      ["Completed Items", exeCompleted],
      ["Overdue Items", exeOverdue],
      ["Today's Completed Items", exeTodayCompleted],
      ["High Priority Items", exeHighPriority],
      ["Urgent Items", exeUrgent],
      ["Average Completion Time (Days)", exeAverageCompletionTime],
      ["Total Attachments", exeTotalAttachments],
      ["Total Active Officers", exeActiveUsersAdmins],
      ["Most Active Officer", exeMostActiveOfficer],
      ["Most Active Office/Institution", exeMostActiveOffice]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Sheet 2: Pending Reports
    const pendingHeaders = [["Record Number", "Reference Number", "Subject", "Classification", "Office/Institution", "Received Date", "Due Date", "Officer Name", "Priority"]];
    const pendingRows = filteredExecutiveEntries.filter(e => e.status === 'Pending' || e.status === 'In Progress').map(e => [
      e.recordNumber, e.referenceNumber, e.subject, e.letterType, e.officeInstitution, e.dateReceived, e.dueDate, e.responsibleOfficerName || e.responsibleOfficer, e.priority
    ]);
    const wsPending = XLSX.utils.aoa_to_sheet([...pendingHeaders, ...pendingRows]);
    XLSX.utils.book_append_sheet(wb, wsPending, "Pending Reports");

    // Sheet 3: Completed Reports
    const completedHeaders = [["Record Number", "Reference Number", "Subject", "Classification", "Office/Institution", "Received Date", "Completion Date", "Completed By", "Priority"]];
    const completedRows = filteredExecutiveEntries.filter(e => e.status === 'Completed').map(e => [
      e.recordNumber, e.referenceNumber, e.subject, e.letterType, e.officeInstitution, e.dateReceived, e.completedAt || e.submissionDate || "", e.completedByName || "", e.priority
    ]);
    const wsCompleted = XLSX.utils.aoa_to_sheet([...completedHeaders, ...completedRows]);
    XLSX.utils.book_append_sheet(wb, wsCompleted, "Completed Reports");

    // Sheet 4: Overdue Reports
    const overdueHeaders = [["Record Number", "Reference Number", "Subject", "Classification", "Office/Institution", "Received Date", "Due Date", "Officer Name", "Priority"]];
    const overdueRows = filteredExecutiveEntries.filter(e => e.status === 'Overdue' || (e.status !== 'Completed' && e.dueDate < todayStr)).map(e => [
      e.recordNumber, e.referenceNumber, e.subject, e.letterType, e.officeInstitution, e.dateReceived, e.dueDate, e.responsibleOfficerName || e.responsibleOfficer, e.priority
    ]);
    const wsOverdue = XLSX.utils.aoa_to_sheet([...overdueHeaders, ...overdueRows]);
    XLSX.utils.book_append_sheet(wb, wsOverdue, "Overdue Reports");

    // Sheet 5: Officer Performance
    const perfHeaders = [["Officer Name", "Designation", "Department", "Total Assigned", "Completed", "Pending", "Overdue", "Completion Rate (%)"]];
    const perfRows = performanceData.map(p => [
      p.name, p.designation, p.department, p.total, p.completed, p.pending, p.overdue, `${p.rate}%`
    ]);
    const wsPerf = XLSX.utils.aoa_to_sheet([...perfHeaders, ...perfRows]);
    XLSX.utils.book_append_sheet(wb, wsPerf, "Officer Performance");

    // Sheet 6: User Activity
    const activityHeaders = [["Timestamp", "User Email", "User Role", "Action", "Details"]];
    const activityFiltered = (activityLogs || []).filter(log => {
      if (!log.timestamp) return false;
      return log.timestamp.startsWith(`${selectedYear}-${selectedMonth}`);
    });
    const activityRows = activityFiltered.map(log => [
      log.timestamp, log.userEmail, log.userRole, log.action, log.details
    ]);
    const wsActivity = XLSX.utils.aoa_to_sheet([...activityHeaders, ...activityRows]);
    XLSX.utils.book_append_sheet(wb, wsActivity, "User Activity");

    // Sheet 7: Attachments Summary
    const attHeaders = [["Record Number", "File Name", "File Type", "File Size", "Upload Date"]];
    const attRows: any[] = [];
    filteredExecutiveEntries.forEach(e => {
      if (e.attachments && e.attachments.length > 0) {
        e.attachments.forEach(a => {
          attRows.push([e.recordNumber, a.name, a.type, a.size || "", a.uploadDate || ""]);
        });
      }
      if (e.completionAttachment) {
        const ca = e.completionAttachment;
        attRows.push([e.recordNumber, `[COMPLETION] ${ca.name}`, ca.type, ca.size || "", ca.uploadDate || ""]);
      }
    });
    const wsAtt = XLSX.utils.aoa_to_sheet([...attHeaders, ...attRows]);
    XLSX.utils.book_append_sheet(wb, wsAtt, "Attachments Summary");

    XLSX.writeFile(wb, `SB_Call_Up_Diary_Monthly_Report_${selectedYear}_${selectedMonth}.xlsx`);
  };

  const handleExportPDF = () => {
    const originalTitle = document.title;
    document.title = `SB_Call_Up_Diary_Monthly_Report_${selectedYear}_${selectedMonth}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  // Calculate monthly aggregates
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData = months.map((m, idx) => {
    const monthEntries = entries.filter(e => {
      const parts = e.dateReceived.split('-');
      if (parts.length < 2) return false;
      const monthNum = parseInt(parts[1], 10) - 1;
      return monthNum === idx && parts[0] === '2026';
    });
    
    return {
      name: m,
      total: monthEntries.length,
      completed: monthEntries.filter(e => e.status === 'Completed').length,
      pending: monthEntries.filter(e => e.status === 'Pending' || e.status === 'In Progress').length,
      overdue: monthEntries.filter(e => e.status === 'Overdue').length
    };
  }).filter(m => m.total > 0);

  // Download simulation as Excel (CSV format)
  const handleExportExcel = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'performance') {
      headers = ["Officer Name", "Designation", "Department", "Total Assigned", "Completed", "Pending", "Overdue", "Completion Rate (%)"];
      rows = performanceData.map(p => [
        p.name, p.designation, p.department, p.total.toString(), 
        p.completed.toString(), p.pending.toString(), p.overdue.toString(), `${p.rate}%`
      ]);
    } else {
      headers = ["Record Number", "Reference Number", "Subject", "Classification", "Office/Institution", "Received Date", "Due Date", "Officer Name", "Priority", "Status"];
      rows = filteredEntries.map(e => [
        e.recordNumber, e.referenceNumber, e.subject, e.letterType, e.officeInstitution,
        e.dateReceived, e.dueDate, e.responsibleOfficerName || e.responsibleOfficer, e.priority, e.status
      ]);
    }

    const csvContent = [headers.join(","), ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `sb_call_up_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger window printing
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-8 print:bg-white print:text-black">
      
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-3 dark:border-slate-800 print:hidden">
        <div className="text-left">
          <h1 className="font-sans text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <FileText className="h-5 w-5 text-indigo-900 dark:text-amber-500" />
            <span>{t.reports}</span>
          </h1>
          <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Audit documents, export registry tables, and monitor user resolution timelines
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2.5 mt-3 md:mt-0">
          {reportType === 'monthlySummary' ? (
            <>
              <button
                onClick={handleExportExecutiveExcel}
                className="flex items-center space-x-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 font-sans text-xs font-bold text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-400 transition-all cursor-pointer"
                id="executive-export-excel-btn"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Multi-Sheet Excel</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center space-x-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-950 px-4.5 py-2 font-sans text-xs font-bold text-white shadow-sm dark:bg-indigo-950 dark:hover:bg-slate-900 transition-all cursor-pointer"
                id="executive-export-pdf-btn"
              >
                <Download className="h-4 w-4" />
                <span>Export PDF Report</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleExportExcel}
                className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 font-sans text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-all cursor-pointer"
                id="reports-export-excel-btn"
              >
                <Download className="h-4 w-4" />
                <span>{t.exportExcel}</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-950 px-4.5 py-2 font-sans text-xs font-bold text-white shadow-sm dark:bg-indigo-950 dark:hover:bg-slate-900 transition-all cursor-pointer"
                id="reports-print-btn"
              >
                <Printer className="h-4 w-4" />
                <span>{t.printFriendly}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reports Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 p-1 bg-slate-50 rounded-xl dark:border-slate-800 dark:bg-slate-950/60 print:hidden">
        {[
          { id: 'pending', label: t.pendingReport, icon: FileText },
          { id: 'completed', label: t.completedReport, icon: CheckCircle },
          { id: 'overdue', label: t.overdueReport, icon: AlertTriangle },
          { id: 'monthly', label: t.monthlyReport, icon: TrendingUp },
          ...(user.role === 'Super Admin' ? [
            { id: 'monthlySummary', label: "Monthly Summary (නිල මාසික වාර්තාව)", icon: FileSpreadsheet },
            { id: 'performance', label: t.userPerformanceReport, icon: Users }
          ] : [])
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as ReportType)}
              className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-2 font-sans text-xs font-semibold transition-all ${
                isActive
                  ? "bg-white text-indigo-900 shadow-xs dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-950 dark:text-slate-400"
              }`}
              id={`report-tab-${tab.id}`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Monthly Summary Month/Year Filters */}
      {reportType === 'monthlySummary' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4.5 dark:border-emerald-950/30 dark:bg-slate-900 print:hidden text-left">
          {/* Month Selection */}
          <div className="flex flex-col text-left">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-amber-500 mb-1">Select Month (මාසය)</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="01">January (ජනවාරි)</option>
              <option value="02">February (පෙබරවාරි)</option>
              <option value="03">March (මාර්තු)</option>
              <option value="04">April (අප්‍රේල්)</option>
              <option value="05">May (මැයි)</option>
              <option value="06">June (ජූනි)</option>
              <option value="07">July (ජූලි)</option>
              <option value="08">August (අගෝස්තු)</option>
              <option value="09">September (සැප්තැම්බර්)</option>
              <option value="10">October (ඔක්තෝබර්)</option>
              <option value="11">November (නොවැම්බර්)</option>
              <option value="12">December (දෙසැම්බර්)</option>
            </select>
          </div>

          {/* Year Selection */}
          <div className="flex flex-col text-left">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-amber-500 mb-1">Select Year (වසර)</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Prompt/Info */}
          <div className="flex flex-col justify-center pl-2">
            <span className="font-sans text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Filtering registry logs for <strong className="text-emerald-800 dark:text-amber-400">{selectedYear} - {selectedMonth}</strong>
            </span>
            <span className="font-sans text-[9px] text-slate-400">
              Includes summary cards, dynamic Recharts trends, and multi-sheet spreadsheet compile.
            </span>
          </div>
        </div>
      )}

      {/* Filter Matrix (Not displayed for monthly report or monthlySummary) */}
      {reportType !== 'monthly' && reportType !== 'performance' && reportType !== 'monthlySummary' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 rounded-xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 print:hidden">
          {/* Priority */}
          <div className="flex flex-col text-left">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Responsible Officer */}
          {user.role === 'Super Admin' && (
            <div className="flex flex-col text-left">
              <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Officer</label>
              <select
                value={officerFilter}
                onChange={(e) => setOfficerFilter(e.target.value)}
                className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="All">All Officers</option>
                {users.map(u => (
                  <option key={u.uid} value={u.uid}>{u.displayName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date From */}
          <div className="flex flex-col text-left">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date Received From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col text-left">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Due Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>
      )}

      {/* Printable Report Output Area */}
      <div 
        ref={printAreaRef}
        className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs print:border-none print:shadow-none print:p-0 transition-colors"
      >
        {/* Printable Header Info */}
        <div className="text-center pb-6 border-b border-double border-slate-300 dark:border-slate-800">
          <span className="font-sans text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
            {t.govLabel}
          </span>
          <h2 className="font-sans text-lg font-black text-slate-900 dark:text-white mt-1 uppercase tracking-wider">
            {t.appTitle} Registry Database
          </h2>
          <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">
            Official {reportType} Status Audit Report &bull; Confirmed Integrity
          </p>
          <div className="flex justify-center items-center space-x-6 text-[10px] text-slate-400 font-mono mt-3">
            <span>Date Generated: {new Date().toLocaleDateString()}</span>
            <span>Target Country: Sri Lanka</span>
            <span>Classification: Restricted Office Data</span>
          </div>
        </div>

        {/* Dynamic Report Table View */}
        <div className="mt-6 overflow-x-auto">
          {reportType === 'monthlySummary' ? (
            /* Executive Monthly Summary Report Page */
            <div className="space-y-8 text-left">
              
              {/* Stat Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {[
                  { label: "Total Records", val: exeTotalRecords, desc: "Filed in this month", icon: FileText, color: "text-slate-900 border-slate-200 bg-slate-50 dark:bg-slate-950/40" },
                  { label: "Pending Items", val: exePending, desc: "Action is required", icon: Clock, color: "text-blue-600 border-blue-100 bg-blue-50/20 dark:bg-blue-950/10" },
                  { label: "Completed Items", val: exeCompleted, desc: "Successfully resolved", icon: CheckCircle, color: "text-emerald-600 border-emerald-100 bg-emerald-50/20 dark:bg-emerald-950/10" },
                  { label: "Overdue Items", val: exeOverdue, desc: "Past due resolution", icon: AlertTriangle, color: "text-red-600 border-red-100 bg-red-50/20 dark:bg-red-950/10" },
                  { label: "Today's Completed", val: exeTodayCompleted, desc: "Completed today overall", icon: CheckSquare, color: "text-indigo-600 border-indigo-100 bg-indigo-50/20 dark:bg-indigo-950/10" },
                  { label: "High Priority", val: exeHighPriority, desc: "High priority in month", icon: ArrowUpRight, color: "text-amber-600 border-amber-100 bg-amber-50/20 dark:bg-amber-950/10" },
                  { label: "Urgent Actions", val: exeUrgent, desc: "Immediate action required", icon: AlertTriangle, color: "text-rose-700 border-rose-100 bg-rose-50/20 dark:bg-rose-950/10" },
                  { label: "Avg Resolution Time", val: exeAverageCompletionTime, desc: "Avg days to complete", icon: Clock, color: "text-cyan-600 border-cyan-100 bg-cyan-50/20 dark:bg-cyan-950/10" },
                  { label: "Total Attachments", val: exeTotalAttachments, desc: "Attached files in month", icon: Paperclip, color: "text-violet-600 border-violet-100 bg-violet-50/20 dark:bg-violet-950/10" },
                  { label: "Active Officers", val: exeActiveUsersAdmins, desc: "Total system users", icon: Users, color: "text-teal-600 border-teal-100 bg-teal-50/20 dark:bg-teal-950/10" },
                  { label: "Most Active Officer", val: exeMostActiveOfficer, desc: "Most entries assigned", icon: Users, color: "text-slate-700 border-slate-200 bg-slate-50 dark:bg-slate-950/40 col-span-2" },
                  { label: "Most Active Office", val: exeMostActiveOffice, desc: "Most records source", icon: Database, color: "text-slate-700 border-slate-200 bg-slate-50 dark:bg-slate-950/40 col-span-2" }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className={`rounded-xl border p-4 shadow-2xs transition-all flex flex-col justify-between ${item.color} dark:border-slate-800`}>
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {item.label}
                        </span>
                        {Icon && <Icon className="h-4 w-4 opacity-70" />}
                      </div>
                      <div className="mt-2 text-left">
                        <div className="font-sans text-lg font-black tracking-tight truncate">
                          {item.val}
                        </div>
                        <p className="font-sans text-[9px] text-slate-400 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8 print:block">
                
                {/* Chart 1: Monthly Records Timeline */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-950/40 print:mb-8 text-left">
                  <h3 className="font-sans text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center space-x-1.5">
                    <TrendingUp className="h-4 w-4 text-indigo-900" />
                    <span>Monthly Registry Load Trend (මාසික ලේඛන ප්‍රවණතාවය)</span>
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                      <LineChart data={exeDailyData}>
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                        <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="Records" stroke="#312e81" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center mt-1">Timeline of new call-up diary entries logged across days 1 to {daysInMonth} of the month.</p>
                </div>

                {/* Chart 2: Completion Status Distribution */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-950/40 print:mb-8 text-left">
                  <h3 className="font-sans text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center space-x-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Resolution Status (ක්‍රියාකාරී තත්ත්වය)</span>
                  </h3>
                  <div className="h-64 w-full flex items-center justify-center">
                    {exeStatusData.length === 0 ? (
                      <div className="text-slate-400 text-xs">No records filed in this period to chart.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                        <PieChart>
                          <Pie
                            data={exeStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {exeStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Chart 3: Priority Distribution */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-950/40 print:mb-8 text-left">
                  <h3 className="font-sans text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center space-x-1.5">
                    <BarChart2 className="h-4 w-4 text-amber-500" />
                    <span>Priority Distribution (ප්‍රමුඛතා ව්‍යාප්තිය)</span>
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                      <BarChart data={exePriorityData}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                        <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                        <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                          {exePriorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Top Officer Assignment */}
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-950/40 text-left">
                  <h3 className="font-sans text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center space-x-1.5">
                    <Users className="h-4 w-4 text-teal-600" />
                    <span>Officer Workloads & Completion (නිලධාරී සේවා නියුක්තිය)</span>
                  </h3>
                  <div className="h-64 w-full">
                    {exeOfficerPerformance.length === 0 ? (
                      <div className="text-slate-400 text-xs h-full flex items-center justify-center">No active assignments mapped in this period.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                        <BarChart data={exeOfficerPerformance}>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                          <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Bar dataKey="Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : reportType === 'monthly' ? (
            /* Monthly Summary Report */
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Month Cycle (2026)</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Total Received</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Completed Actions</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Overdue Actions</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Resolution Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {monthlyData.map((m, idx) => {
                  const rate = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{m.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">{m.total}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{m.completed}</td>
                      <td className="py-3 px-4 font-bold text-red-600 dark:text-red-400">{m.overdue}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 uppercase">
                          {rate}% Complete
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : reportType === 'performance' ? (
            /* User Performance Report */
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Officer Name</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Designation / Department</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Assigned</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Completed</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Pending</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Overdue</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Performance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {performanceData.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      <div className="font-semibold">{p.designation}</div>
                      <div className="text-[10px] font-mono opacity-80">{p.department}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">{p.total}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{p.completed}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">{p.pending}</td>
                    <td className="py-3 px-4 font-bold text-red-600 dark:text-red-400">{p.overdue}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden dark:bg-slate-800">
                          <div className="bg-emerald-500 h-full" style={{ width: `${p.rate}%` }} />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">{p.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Documents List Reports (Pending, Completed, Overdue) */
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.recordNumber}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.refNumber}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.subject}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.officeInstitution}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.dueDate}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.responsibleOfficer}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.priority}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No matching records are registered in the journal.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-900 dark:text-indigo-400">{entry.recordNumber}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">{entry.referenceNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 max-w-xs truncate">{entry.subject}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">{entry.officeInstitution}</td>
                      <td className="py-3 px-4 font-bold text-red-600 dark:text-red-400">{entry.dueDate}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold">{entry.responsibleOfficerName || entry.responsibleOfficer}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          entry.priority === 'Urgent' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                          entry.priority === 'High' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          entry.priority === 'Medium' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {entry.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-slate-300">
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Signature Box at print time */}
        <div className="hidden print:flex justify-between items-center mt-12 pt-12 border-t border-slate-200">
          <div className="text-left">
            <div className="border-b border-black w-48 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2 block">Officer-in-Charge Signature</span>
          </div>
          <div className="text-right">
            <div className="border-b border-black w-48 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2 block">Authorized Registrar seal</span>
          </div>
        </div>

      </div>

    </div>
  );
});

export default Reports;
