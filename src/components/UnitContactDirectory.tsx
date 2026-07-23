import { useState, useMemo, FormEvent, ChangeEvent } from "react";
import { 
  Phone, Search, Plus, Upload, Copy, Check, PhoneCall, 
  X, Edit2, Trash2, BookUser, FileSpreadsheet, RefreshCw, AlertCircle, Building2
} from "lucide-react";
import * as XLSX from "xlsx";
import { UserProfile, UnitContact } from "../types";
import { 
  createUnitContact, updateUnitContact, deleteUnitContact, 
  importUnitContacts, preSeededUnitContacts 
} from "../lib/db";

interface UnitContactDirectoryProps {
  user: UserProfile;
  language: 'en' | 'si';
  contacts: UnitContact[];
  onRefresh?: () => void;
}

export default function UnitContactDirectory({
  user,
  language,
  contacts,
  onRefresh
}: UnitContactDirectoryProps) {
  const isSi = language === 'si';
  const isSuperAdmin = user.role === 'Super Admin';

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // UI Toast feedback for copy
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingContact, setEditingContact] = useState<UnitContact | null>(null);

  // Form input states
  const [formData, setFormData] = useState({ conNo: '', unitName: '', telephone: '' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<Omit<UnitContact, 'id' | 'createdAt'>[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importing, setImporting] = useState(false);

  // Delete confirmation modal state
  const [deletingContact, setDeletingContact] = useState<UnitContact | null>(null);

  // Filter & Sort contacts
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Search query filter (matches Unit Name, Telephone Number, or Con. No)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(contact => 
        (contact.unitName || '').toLowerCase().includes(q) ||
        (contact.telephone || '').toLowerCase().includes(q) ||
        (contact.conNo || '').toLowerCase().includes(q)
      );
    }

    // Sort alphabetically by Unit Name
    result.sort((a, b) => (a.unitName || '').localeCompare(b.unitName || ''));

    return result;
  }, [contacts, searchQuery]);

  // Handle Copy Number
  const handleCopyNumber = (contact: UnitContact) => {
    if (!contact.telephone) return;
    navigator.clipboard.writeText(contact.telephone);
    setCopiedId(contact.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Handle Open Create Modal
  const handleOpenCreate = () => {
    setEditingContact(null);
    setFormData({ conNo: '', unitName: '', telephone: '' });
    setFormError('');
    setShowFormModal(true);
  };

  // Handle Open Edit Modal
  const handleOpenEdit = (contact: UnitContact) => {
    setEditingContact(contact);
    setFormData({
      conNo: contact.conNo || '',
      unitName: contact.unitName || '',
      telephone: contact.telephone || ''
    });
    setFormError('');
    setShowFormModal(true);
  };

  // Handle Save (Create or Edit)
  const handleSaveContact = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.unitName.trim()) {
      setFormError(isSi ? 'කරුණාකර ඒකකයේ / ශාඛාවේ නම ඇතුළත් කරන්න.' : 'Unit / Branch Name is required.');
      return;
    }
    if (!formData.telephone.trim()) {
      setFormError(isSi ? 'කරුණාකර දුරකථන අංකය ඇතුළත් කරන්න.' : 'Telephone number is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingContact) {
        await updateUnitContact({
          ...editingContact,
          conNo: formData.conNo.trim(),
          unitName: formData.unitName.trim(),
          telephone: formData.telephone.trim()
        });
      } else {
        await createUnitContact({
          conNo: formData.conNo.trim(),
          unitName: formData.unitName.trim(),
          telephone: formData.telephone.trim()
        });
      }

      setShowFormModal(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save unit contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Contact
  const handleDeleteContact = async () => {
    if (!deletingContact) return;
    setIsSubmitting(true);
    try {
      await deleteUnitContact(deletingContact.id);
      setDeletingContact(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle File Upload for Import (Excel/CSV)
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Parse rows as raw 2D array
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawRows || rawRows.length === 0) {
          alert('Uploaded file is empty.');
          return;
        }

        const parsed: Omit<UnitContact, 'id' | 'createdAt'>[] = [];

        // Check if row 0 has headers
        const firstRow = rawRows[0].map(c => String(c || '').toLowerCase().trim());
        let conNoIdx = -1;
        let unitIdx = -1;
        let telIdx = -1;

        firstRow.forEach((colName, idx) => {
          if (colName.includes('con') || colName.includes('no') || colName.includes('s.no') || colName.includes('sr')) {
            if (conNoIdx === -1) conNoIdx = idx;
          }
          if (colName.includes('unit') || colName.includes('branch') || colName.includes('station') || colName.includes('office') || colName.includes('name')) {
            if (unitIdx === -1) unitIdx = idx;
          }
          if (colName.includes('tel') || colName.includes('phone') || colName.includes('call') || colName.includes('contact') || colName.includes('mobile')) {
            if (telIdx === -1) telIdx = idx;
          }
        });

        // Fallbacks if headers not detected
        if (conNoIdx === -1) conNoIdx = 0;
        if (unitIdx === -1) unitIdx = 1;
        if (telIdx === -1) telIdx = 2;

        const startRow = (conNoIdx === 0 && (firstRow[0].includes('con') || firstRow[1]?.includes('unit'))) ? 1 : 0;

        for (let i = startRow; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          const conVal = row[conNoIdx] !== undefined ? String(row[conNoIdx]).trim() : '';
          const unitVal = row[unitIdx] !== undefined ? String(row[unitIdx]).trim() : '';
          const telVal = row[telIdx] !== undefined ? String(row[telIdx]).trim() : '';

          if (unitVal || telVal) {
            parsed.push({
              conNo: conVal,
              unitName: unitVal || 'Unknown Unit',
              telephone: telVal
            });
          }
        }

        setImportPreview(parsed);
      } catch (err: any) {
        alert('Failed to parse file: ' + err.message);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Submit Batch Import
  const handleConfirmImport = async () => {
    if (importPreview.length === 0) return;
    setImporting(true);
    try {
      await importUnitContacts(importPreview);
      setShowImportModal(false);
      setImportPreview([]);
      setImportFileName('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Seed sample data if empty
  const handleSeedSampleData = async () => {
    if (!isSuperAdmin) return;
    if (confirm('Import default Sri Lanka Police Unit Telephone Directory items?')) {
      try {
        await importUnitContacts(preSeededUnitContacts.map(c => ({
          conNo: c.conNo,
          unitName: c.unitName,
          telephone: c.telephone
        })));
        if (onRefresh) onRefresh();
      } catch (err: any) {
        alert('Failed to seed data: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
            <BookUser className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-sans text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isSi ? "ඒකක දුරකථන නාමාවලිය" : "Unit Contact Directory"}
              </h1>
              <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-950 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {contacts.length} {isSi ? "සටහන්" : "Contacts"}
              </span>
            </div>
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isSi 
                ? "සියලුම පාලන ඒකක සහ ප්‍රාදේශීය කාර්යාලවල සෘජු දුරකථන අංක නාමාවලිය" 
                : "Searchable directory for all police units, branches, and station contacts."}
            </p>
          </div>
        </div>

        {/* Super Admin Action Buttons */}
        {isSuperAdmin && (
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {contacts.length === 0 && (
              <button
                onClick={handleSeedSampleData}
                className="flex items-center space-x-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{isSi ? "ප්‍රකාශිත ආදර්ශ දත්ත එක් කරන්න" : "Seed Default Directory"}</span>
              </button>
            )}

            <button
              onClick={() => {
                setImportPreview([]);
                setImportFileName('');
                setShowImportModal(true);
              }}
              className="flex items-center space-x-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{isSi ? "Excel / CSV ආයාත කරන්න" : "Import Excel / CSV"}</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white px-4 py-2.5 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{isSi ? "අංකයක් එක් කරන්න" : "Add Contact"}</span>
            </button>
          </div>
        )}
      </div>

      {/* SMART SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isSi ? "ඒකකයේ නම, දුරකථන අංකය, හෝ Con. No අනුව සොයන්න..." : "Search by Unit Name, Telephone Number, or Con. No..."}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-11 pr-10 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              title="Clear Search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Status & Counter */}
        <div className="flex items-center justify-between mt-3 px-1 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {searchQuery.trim() ? (
              <>
                {isSi ? "සෙවුම් ප්‍රතිඵල:" : "Showing"} <strong className="text-indigo-600 dark:text-indigo-400">{filteredContacts.length}</strong> {isSi ? "අතුරින්" : "out of"} <strong>{contacts.length}</strong>
              </>
            ) : (
              <>
                {isSi ? "ලැයිස්තුගත මුළු අංක:" : "Total directory listings:"} <strong className="text-slate-800 dark:text-slate-200">{contacts.length}</strong>
              </>
            )}
          </span>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            {isSi ? "අකාරාදී පිළිවෙළට සකසා ඇත" : "Sorted Alphabetically A-Z"}
          </span>
        </div>
      </div>

      {/* DIRECTORY CARDS GRID */}
      {filteredContacts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-200"
            >
              <div>
                {/* Header Row: Unit Name & Con. No */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-3">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                      <Building2 className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="font-sans text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {contact.unitName}
                    </h3>
                  </div>

                  {contact.conNo && (
                    <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Con. No : {contact.conNo}
                    </span>
                  )}
                </div>

                {/* Telephone Number Row */}
                <div className="flex items-center space-x-2 my-2 text-slate-800 dark:text-slate-200 font-mono text-base font-bold tracking-tight">
                  <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Telephone : {contact.telephone || "N/A"}</span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                {/* Primary Action Buttons */}
                <div className="flex items-center space-x-2 flex-1">
                  {/* ☎ Call Button */}
                  <a
                    href={`tel:${contact.telephone}`}
                    className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                    title={`Call ${contact.unitName}`}
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>☎ Call Button</span>
                  </a>

                  {/* 📋 Copy Number */}
                  <button
                    onClick={() => handleCopyNumber(contact)}
                    className={`flex items-center justify-center space-x-1 rounded-xl border py-2 px-3 text-xs font-semibold transition-all cursor-pointer ${
                      copiedId === contact.id
                        ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-300"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                    title="Copy Telephone Number"
                  >
                    {copiedId === contact.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="font-bold text-[11px]">{isSi ? "පිටපත් විය!" : "Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-[11px]">📋 Copy Number</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Super Admin Edit & Delete Actions */}
                {isSuperAdmin && (
                  <div className="flex items-center space-x-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                    <button
                      onClick={() => handleOpenEdit(contact)}
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Contact"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingContact(contact)}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Delete Contact"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* NO RESULT FOUND STATE */
        <div className="flex flex-col items-center justify-center min-h-[350px] p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
            <BookUser className="h-8 w-8" />
          </div>
          <h3 className="font-sans text-base font-bold text-slate-900 dark:text-white">
            {isSi ? "ප්‍රතිඵල හමු නොවීය" : "No Unit Contacts Found"}
          </h3>
          <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            {searchQuery 
              ? (isSi ? `'${searchQuery}' සඳහා ගැළපෙන දුරකථන අංක නොමැත.` : `No contacts matching '${searchQuery}'. Please try a different search term.`)
              : (isSi ? "නාමාවලිය දැනට හිස්ව පවතී." : "The unit contact directory is currently empty.")
            }
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-4 py-2 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>{isSi ? "සෙවීම ඉවත් කරන්න" : "Clear Search"}</span>
            </button>
          ) : (
            isSuperAdmin && (
              <button
                onClick={handleSeedSampleData}
                className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-indigo-900 text-white px-4 py-2.5 text-xs font-semibold hover:bg-indigo-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{isSi ? "ආදර්ශ නාමාවලිය ආයාත කරන්න" : "Import Default Unit Contacts"}</span>
              </button>
            )
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT CONTACT */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Phone className="h-5 w-5" />
                </div>
                <h3 className="font-sans text-base font-bold text-slate-900 dark:text-white">
                  {editingContact 
                    ? (isSi ? "සටහන සංස්කරණය" : "Edit Unit Contact")
                    : (isSi ? "නව ඒකක අංකයක් එක් කරන්න" : "Add Unit Contact")}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-4 mt-4">
              {formError && (
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isSi ? "සම්බන්ධතා අංකය (Con. No)" : "Con. No. (Connection / Serial No)"}
                </label>
                <input
                  type="text"
                  value={formData.conNo}
                  onChange={(e) => setFormData({ ...formData, conNo: e.target.value })}
                  placeholder="e.g. 01"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isSi ? "ඒකකය / ශාඛාව *" : "Unit / Branch Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.unitName}
                  onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                  placeholder="e.g. Ambalangoda"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isSi ? "දුරකථන අංකය *" : "Telephone Number *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="e.g. 091-2256099"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  {isSi ? "අවලංගු කරන්න" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 dark:bg-indigo-700 dark:hover:bg-indigo-600 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (isSi ? "සුරකිමින්..." : "Saving...") : (isSi ? "සුරකින්න" : "Save Contact")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT EXCEL / CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-bold text-slate-900 dark:text-white">
                    {isSi ? "Excel / CSV මඟින් ආයාත කරන්න" : "Import Unit Contacts from Excel or CSV"}
                  </h3>
                  <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                    {isSi 
                      ? "Con. No, Unit / Branch, Telephone අඩංගු ගොනුවක් තෝරන්න." 
                      : "Select an .xlsx or .csv file containing Con. No, Unit / Branch, and Telephone columns."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {/* File Uploader Input */}
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all cursor-pointer">
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {importFileName ? importFileName : (isSi ? "ගොනුවක් තෝරන්න හෝ මෙහි තබන්න (.xlsx, .csv)" : "Click to select or drag file here (.xlsx, .csv)")}
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="mt-2 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                />
              </div>

              {/* Preview Table */}
              {importPreview.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isSi ? "ආයාත කිරීමට නියමිත දත්ත පෙරදසුන:" : "Preview Rows to Import:"} ({importPreview.length})
                    </span>
                  </div>
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-2.5">Con. No</th>
                          <th className="p-2.5">Unit / Branch</th>
                          <th className="p-2.5">Telephone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {importPreview.slice(0, 50).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2.5 font-mono text-slate-500">{row.conNo || '-'}</td>
                            <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{row.unitName}</td>
                            <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">{row.telephone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importPreview.length > 50 && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      + {importPreview.length - 50} more items will be imported.
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  {isSi ? "අවලංගු කරන්න" : "Cancel"}
                </button>
                <button
                  type="button"
                  disabled={importPreview.length === 0 || importing}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {importing ? (isSi ? "ආයාත වෙමින්..." : "Importing...") : (isSi ? "ආයාත කරන්න" : `Import ${importPreview.length} Contacts`)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="font-sans text-base font-bold text-slate-900 dark:text-white">
              {isSi ? "සටහන මකා දැමීමට තහවුරු කරන්න" : "Delete Unit Contact?"}
            </h3>
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isSi 
                ? `'${deletingContact.unitName}' මකා දැමීමට ඔබට විශ්වාසද?` 
                : `Are you sure you want to delete '${deletingContact.unitName}'? This action cannot be undone.`}
            </p>
            <div className="flex items-center justify-center space-x-2 mt-6">
              <button
                onClick={() => setDeletingContact(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                {isSi ? "අවලංගු කරන්න" : "Cancel"}
              </button>
              <button
                onClick={handleDeleteContact}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {isSubmitting ? (isSi ? "මකා දමමින්..." : "Deleting...") : (isSi ? "මකා දමන්න" : "Yes, Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
