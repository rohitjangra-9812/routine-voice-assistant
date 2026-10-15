import React, { useState } from 'react';
import {
  ScheduleEvent,
  CategoryType,
  PriorityType,
  ScheduleConflict,
} from '../types.ts';
import {
  format12Hour,
  findScheduleConflicts,
  getSampleEvents,
} from '../utils/scheduleLogic.ts';
import {
  Plus,
  Search,
  Clock,
  Edit2,
  Trash2,
  Check,
  Bell,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  MapPin,
  FileText,
  X,
  Volume2,
} from 'lucide-react';

interface ScheduleManagerProps {
  events: ScheduleEvent[];
  onAddEvent: (event: Omit<ScheduleEvent, 'id'>) => void;
  onUpdateEvent: (event: ScheduleEvent) => void;
  onDeleteEvent: (id: string) => void;
  onLoadSampleEvents: () => void;
  onTriggerTestEventAlert: (event: ScheduleEvent) => void;
  globalLeadTimeMinutes: number;
}

const CATEGORY_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'routine', label: 'Routine' },
  { value: 'focus', label: 'Focus Block' },
  { value: 'break', label: 'Break / Meal' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'personal', label: 'Personal' },
];

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onLoadSampleEvents,
  onTriggerTestEventAlert,
  globalLeadTimeMinutes,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<CategoryType>('routine');
  const [formTime, setFormTime] = useState('09:00');
  const [formDuration, setFormDuration] = useState(30);
  const [formLeadTime, setFormLeadTime] = useState<number | undefined>(undefined);
  const [formPriority, setFormPriority] = useState<PriorityType>('medium');
  const [formNotes, setFormNotes] = useState('');
  const [formLocation, setFormLocation] = useState('');

  const conflicts = findScheduleConflicts(events);

  const openAddModal = () => {
    setEditingEvent(null);
    setFormTitle('');
    setFormCategory('routine');
    setFormTime('09:00');
    setFormDuration(30);
    setFormLeadTime(undefined);
    setFormPriority('medium');
    setFormNotes('');
    setFormLocation('');
    setIsModalOpen(true);
  };

  const openEditModal = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormCategory(event.category);
    setFormTime(event.time);
    setFormDuration(event.durationMinutes);
    setFormLeadTime(event.leadTimeMinutes);
    setFormPriority(event.priority);
    setFormNotes(event.notes || '');
    setFormLocation(event.location || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formTime) return;

    if (editingEvent) {
      onUpdateEvent({
        ...editingEvent,
        title: formTitle.trim(),
        category: formCategory,
        time: formTime,
        durationMinutes: Number(formDuration),
        leadTimeMinutes: formLeadTime ? Number(formLeadTime) : undefined,
        priority: formPriority,
        notes: formNotes.trim() || undefined,
        location: formLocation.trim() || undefined,
      });
    } else {
      onAddEvent({
        title: formTitle.trim(),
        category: formCategory,
        time: formTime,
        durationMinutes: Number(formDuration),
        leadTimeMinutes: formLeadTime ? Number(formLeadTime) : undefined,
        priority: formPriority,
        notes: formNotes.trim() || undefined,
        location: formLocation.trim() || undefined,
        enabled: true,
        completed: false,
      });
    }

    setIsModalOpen(false);
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      {/* Header & Primary Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Routine & Meeting Schedule
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Manage your daily tasks, meetings, and voice reminder triggers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onLoadSampleEvents}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Load preset sample routines"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Preset Sample Routines</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Schedule Item</span>
          </button>
        </div>
      </div>

      {/* Conflicts Warning Banner */}
      {conflicts.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-300">Schedule Conflict Detected ({conflicts.length})</div>
            <p className="text-amber-200/80 mt-0.5">
              Overlapping items found:{' '}
              {conflicts
                .map((c) => `"${c.eventA.title}" and "${c.eventB.title}" (${c.overlapMinutes}m overlap)`)
                .join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Items
          </button>
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / List */}
      <div className="space-y-3">
        {filteredEvents.map((event) => {
          const lead = event.leadTimeMinutes ?? globalLeadTimeMinutes;

          return (
            <div
              key={event.id}
              className={`p-4 rounded-xl border transition-all ${
                event.enabled
                  ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/30 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Category Indicator Badge */}
                  <div className="flex flex-col items-center justify-center min-w-[65px] p-2 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-sm font-bold font-mono text-white">
                      {format12Hour(event.time)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {event.durationMinutes} min
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{event.title}</h4>
                      <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                        {event.category}
                      </span>
                      {event.priority === 'high' && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/50">
                          High Priority
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {event.location}
                        </span>
                      )}
                      {event.notes && (
                        <span className="flex items-center gap-1 line-clamp-1 max-w-xs">
                          <FileText className="w-3 h-3 text-slate-500" />
                          {event.notes}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-indigo-300">
                        <Bell className="w-3 h-3 text-indigo-400" />
                        Alert: {lead}m before
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onTriggerTestEventAlert(event)}
                    className="p-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/60 rounded border border-indigo-900/50 transition-colors"
                    title="Test Voice Alert for this event"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      onUpdateEvent({ ...event, enabled: !event.enabled })
                    }
                    className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                      event.enabled
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {event.enabled ? 'Alerts On' : 'Alerts Off'}
                  </button>

                  <button
                    onClick={() => openEditModal(event)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteEvent(event.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No events found matching criteria.</p>
            <p className="text-xs text-slate-600 mt-1">
              Add a new schedule item or click "Load Preset Sample Routines" above.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {editingEvent ? 'Edit Schedule Item' : 'Add New Schedule Item'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Team Standup, Lunch Break, Workout"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CategoryType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Time (HH:MM) *
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custom Alert Buffer (Mins)
                  </label>
                  <select
                    value={formLeadTime ?? ''}
                    onChange={(e) =>
                      setFormLeadTime(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Use Default ({globalLeadTimeMinutes}m)</option>
                    <option value="5">5 minutes before</option>
                    <option value="10">10 minutes before</option>
                    <option value="15">15 minutes before</option>
                    <option value="20">20 minutes before</option>
                    <option value="30">30 minutes before</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as PriorityType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Location / Link
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google Meet, Room 3B"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional agenda or reminder context..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
                >
                  {editingEvent ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
