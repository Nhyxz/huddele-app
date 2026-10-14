import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OperationalAction } from '../models';
import { HuddleTimelineRibbon } from '../features/live-huddle/HuddleTimelineRibbon';
import { HuddleSummaryCards } from '../features/live-huddle/HuddleSummaryCards';
import { HuddleHeaderControls } from '../features/live-huddle/HuddleHeaderControls';
import { ActionToolbar } from '../features/live-huddle/ActionToolbar';
import { BulkActionBar } from '../features/live-huddle/BulkActionBar';
import { ActionTable } from '../features/live-huddle/ActionTable';
import { ActionSlideOver } from '../features/live-huddle/ActionSlideOver';
import { TransferModal } from '../features/live-huddle/TransferModal';
import { SummaryModal } from '../features/live-huddle/SummaryModal';
import { AuditLogModal } from '../components/common/AuditLogModal';
import { ImportPatientsModal } from '../features/live-huddle/ImportPatientsModal';
import { BottomBar } from '../components/common/BottomBar';

export const LiveHuddlePage: React.FC = () => {
  const { 
    currentHuddle, 
    currentHuddleActions, 
    activeRole, 
    settings, 
    bulkUpdateActions, 
    bulkDeleteActions 
  } = useApp();

  const isReadOnly = activeRole === 'Read Only Viewer' || currentHuddle?.status === 'Completed';

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [holderFilter, setHolderFilter] = useState('ALL');
  const [showTransferred, setShowTransferred] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Panels state
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [actionToEdit, setActionToEdit] = useState<OperationalAction | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [singleTransferAction, setSingleTransferAction] = useState<OperationalAction | null>(null);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditAction, setAuditAction] = useState<OperationalAction | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filter actions logic
  const filteredActions = currentHuddleActions.filter(action => {
    // Hide transferred actions unless toggled
    if (!showTransferred && (action.status === 'Transferred' || action.transferred)) {
      return false;
    }

    // Search query matching initials, location, description, holder, comments
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        action.initials.toLowerCase().includes(q) ||
        action.location.toLowerCase().includes(q) ||
        action.description.toLowerCase().includes(q) ||
        action.holder.toLowerCase().includes(q) ||
        action.comments.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (statusFilter !== 'ALL' && action.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && action.priority !== priorityFilter) return false;
    if (locationFilter !== 'ALL' && action.location !== locationFilter) return false;
    if (holderFilter !== 'ALL' && action.holder !== holderFilter) return false;

    return true;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setLocationFilter('ALL');
    setHolderFilter('ALL');
    setShowTransferred(false);
  };

  const handleBulkSetStatus = async (status: OperationalAction['status']) => {
    if (selectedIds.length === 0) return;
    await bulkUpdateActions(selectedIds, { status });
    setSelectedIds([]);
  };

  const handleBulkAssignHolder = async (holder: string) => {
    if (selectedIds.length === 0) return;
    await bulkUpdateActions(selectedIds, { holder });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Delete ${selectedIds.length} selected action(s)? This will be recorded in the audit trail.`)) {
      await bulkDeleteActions(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleOpenAddAction = () => {
    setActionToEdit(null);
    setIsSlideOverOpen(true);
  };

  const handleEditAction = (action: OperationalAction) => {
    setActionToEdit(action);
    setIsSlideOverOpen(true);
  };

  const handleTransferSingle = (action: OperationalAction) => {
    setSingleTransferAction(action);
    setIsTransferModalOpen(true);
  };

  const handleOpenTransferBulk = () => {
    setSingleTransferAction(null);
    setIsTransferModalOpen(true);
  };

  const handleViewAudit = (action: OperationalAction) => {
    setAuditAction(action);
    setIsAuditModalOpen(true);
  };

  const handleFilterOutstanding = () => {
    setStatusFilter('In Progress');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F0F4F5]">
      {/* 1. Top Huddle Timeline Ribbon */}
      <HuddleTimelineRibbon />

      {/* 2. Top Summary Cards */}
      <HuddleSummaryCards />

      {/* 3. Main Working Area Card */}
      <div className="flex-1 flex flex-col mx-3 mb-2 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {/* Huddle Header Controls */}
        <HuddleHeaderControls
          onOpenTransfer={handleOpenTransferBulk}
          onOpenSummary={() => setIsSummaryModalOpen(true)}
        />

        {/* Action Toolbar */}
        <ActionToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          holderFilter={holderFilter}
          setHolderFilter={setHolderFilter}
          showTransferred={showTransferred}
          setShowTransferred={setShowTransferred}
          onClearFilters={handleClearFilters}
          onOpenAddAction={handleOpenAddAction}
        />

        {/* Bulk Action Bar with click-drag selection hint */}
        <BulkActionBar
          count={selectedIds.length}
          holders={settings.actionHolders}
          onSetStatus={handleBulkSetStatus}
          onAssignHolder={handleBulkAssignHolder}
          onTransfer={handleOpenTransferBulk}
          onDelete={handleBulkDelete}
          onClear={() => setSelectedIds([])}
        />

        {/* Action Table */}
        <ActionTable
          actions={filteredActions}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          readOnly={isReadOnly}
          onEditAction={handleEditAction}
          onTransferSingle={handleTransferSingle}
          onViewAudit={handleViewAudit}
          onOpenPaste={() => setIsImportModalOpen(true)}
        />
      </div>

      {/* 4. Bottom Quick Action Bar */}
      <BottomBar
        onOpenImport={() => setIsImportModalOpen(true)}
        onFilterOutstanding={handleFilterOutstanding}
        onOpenTransfer={handleOpenTransferBulk}
      />

      {/* Slide-over panel for Add/Edit */}
      <ActionSlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        actionToEdit={actionToEdit}
      />

      {/* Transfer Unactioned Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        singleActionToTransfer={singleTransferAction}
        initialSelectedIds={selectedIds}
      />

      {/* Instant Summary Modal */}
      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
      />

      {/* Audit History Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        action={auditAction}
      />

      {/* Import Patients Demo Modal */}
      <ImportPatientsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
