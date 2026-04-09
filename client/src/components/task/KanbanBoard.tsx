import { useState, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Task, projectsApi } from '../../api/projects'
import { useProjectStore } from '../../store/projectStore'
import TaskCard from './TaskCard'
import CreateTaskModal from './CreateTaskModal'
import { Button } from '@/components/ui/button'
import { PRIORITY_CONFIG, getLabelColor } from '../../config/taskConfig'
import type { Priority } from '../../api/projects'
import { Member } from '../../api/projects'

const COLUMNS = [
  { id: 'TODO', label: 'To do', color: 'bg-slate-100 dark:bg-slate-800' },
  { id: 'IN_PROGRESS', label: 'In progress', color: 'bg-blue-50 dark:bg-blue-950' },
  { id: 'DONE', label: 'Done', color: 'bg-green-50 dark:bg-green-950' },
] as const

type ColumnId = 'TODO' | 'IN_PROGRESS' | 'DONE'

interface ColumnProps {
  id: ColumnId
  label: string
  color: string
  tasks: Task[]
  projectId: string
  socket?: any
  canEdit?: boolean
  members?: Member[]
  onAddTask: (columnId: string) => void
}

function DroppableColumn({ id, label, color, tasks, projectId, socket, canEdit = true, members = [], onAddTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex-shrink-0 w-72">
      <div className={`rounded-lg p-3 transition-colors ${color} ${isOver ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">{label}</h3>
            <span className="text-xs bg-background text-muted-foreground px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-lg leading-none"
              onClick={() => onAddTask(id)}
            >
              +
            </Button>
          )}
        </div>

        <div ref={setNodeRef} className="min-h-20 space-y-2">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
  <TaskCard
    key={task.id}
    task={task}
    projectId={projectId}
    socket={socket}
    canEdit={canEdit}
    members={members}
  />
))}
          </SortableContext>
        </div>
      </div>
    </div>
  )
}

interface Props {
  projectId: string
  socket?: any
  canEdit?: boolean
  members?: Member[]
}


export default function KanbanBoard({ projectId, socket, canEdit = true, members = [] }: Props) {
  const { currentProject, updateTask } = useProjectStore()
  const tasks = currentProject?.tasks || []

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [createColumn, setCreateColumn] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null)
  const [filterLabel, setFilterLabel] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const allLabels = useMemo(() => {
    const labels = new Set<string>()
    tasks.forEach(t => t.labels?.forEach(l => labels.add(l)))
    return Array.from(labels)
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterPriority && t.priority !== filterPriority) return false
      if (filterLabel && !t.labels?.includes(filterLabel)) return false
      return true
    })
  }, [tasks, filterPriority, filterLabel])

  const getColumnTasks = (status: string) =>
    filteredTasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position)

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    const overColumn = COLUMNS.find((c) => c.id === overId)
    const overTask = tasks.find((t) => t.id === overId)
    const targetStatus = overColumn?.id ?? overTask?.status

    if (targetStatus && targetStatus !== activeTask.status) {
      updateTask(activeId, { status: targetStatus as Task['status'] })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const draggedTask = tasks.find((t) => t.id === activeId)
    if (!draggedTask) return

    const overColumn = COLUMNS.find((c) => c.id === overId)
    const overTask = tasks.find((t) => t.id === overId)
    const newStatus = (overColumn?.id ?? overTask?.status ?? draggedTask.status) as Task['status']

    try {
      await projectsApi.updateTask(projectId, activeId, { status: newStatus })
    } catch {
      updateTask(activeId, { status: draggedTask.status })
    }
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Filter:</span>
        {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
          <button
            key={p}
            onClick={() => setFilterPriority(filterPriority === p ? null : p)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
              filterPriority === p
                ? `${PRIORITY_CONFIG[p].color} border-current`
                : 'bg-secondary text-muted-foreground border-transparent hover:border-border'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
            {PRIORITY_CONFIG[p].label}
          </button>
        ))}
        {allLabels.map(label => (
          <button
            key={label}
            onClick={() => setFilterLabel(filterLabel === label ? null : label)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              filterLabel === label
                ? getLabelColor(label)
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {label}
          </button>
        ))}
        {(filterPriority || filterLabel) && (
          <button
            onClick={() => { setFilterPriority(null); setFilterLabel(null) }}
            className="px-2.5 py-1 rounded-full text-xs text-muted-foreground hover:text-foreground border border-border"
          >
            Clear filters
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {COLUMNS.map((column) => (
  <DroppableColumn
    key={column.id}
    id={column.id}
    label={column.label}
    color={column.color}
    tasks={getColumnTasks(column.id)}
    projectId={projectId}
    socket={socket}
    canEdit={canEdit}
    members={members}
    onAddTask={setCreateColumn}
  />
))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="opacity-90 rotate-1 shadow-lg">
              <TaskCard task={activeTask} projectId={projectId} socket={socket} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {createColumn && (
  <CreateTaskModal
    projectId={projectId}
    defaultStatus={createColumn}
    members={members}
    onClose={() => setCreateColumn(null)}
  />
)}
    </>
  )
}