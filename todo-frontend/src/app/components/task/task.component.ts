import { Component, OnInit, NgZone } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-task',
  standalone: true,
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css'],
  imports: [
    FormsModule,
    CommonModule,
    DragDropModule
  ]
})
export class TaskComponent implements OnInit {

  // 🧠 Kanban state real
  pendingTasks: Task[] = [];
  doneTasks: Task[] = [];
  tasks: Task[] = [];
  newTask: string = '';

  // 🌙 DARK MODE STATE
  darkMode: boolean = false;

  constructor(
    private service: TaskService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.loadTasks();
  }

  /* ==============================
     🌙 DARK MODE
  ============================== */

  toggleTheme(): void {
    if (typeof document === 'undefined') return;

    this.darkMode = !this.darkMode;

    document.body.classList.toggle('dark', this.darkMode);

    try {
      localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
    } catch (e) {
      console.log('localStorage não disponível');
    }
  }

  loadTheme(): void {
    if (typeof document === 'undefined') return;

    const savedTheme = localStorage.getItem('theme');

    this.darkMode = savedTheme === 'dark';

    document.body.classList.toggle('dark', this.darkMode);
  }

  /* ==============================
     📥 LOAD TASKS (KANBAN SPLIT)
  ============================== */

 loadTasks(): void {
  this.service.getAll().subscribe({
    next: (data: Task[]) => {

      const tasks = data.map(t => ({
        ...t,
        editing: false
      }));

      this.pendingTasks = tasks.filter(t => !t.completed);
      this.doneTasks = tasks.filter(t => t.completed);

    },
    error: (error) => {
      console.error('Erro ao carregar tarefas:', error);
    }
  });
}

  /* ==============================
     ➕ ADD TASK
  ============================== */

  addTask(): void {
  const title = this.newTask.trim();
  if (!title) return;

  const task: Task = {
    title,
    completed: false,
    createdAt: new Date()
  };

  this.service.create(task).subscribe({
    next: (createdTask: any) => {

      this.ngZone.run(() => {
        this.pendingTasks.unshift({
          ...createdTask,
          editing: false,
          createdAt: createdTask.createdAt ?? new Date()
        });

        this.newTask = '';
      });

    },
    error: (error) => {
      console.error('Erro ao adicionar tarefa:', error);
    }
  });
}

  /* ==============================
     🔄 TOGGLE TASK
  ============================== */

  toggleTask(task: Task) {
    task.completed = !task.completed;

    this.refreshColumns();
  }

  /* ==============================
     🔁 REFRESH KANBAN
  ============================== */

  private refreshColumns(): void {
    const allTasks = [...this.pendingTasks, ...this.doneTasks];

    this.pendingTasks = allTasks.filter(t => !t.completed);
    this.doneTasks = allTasks.filter(t => t.completed);
  }

  /* ==============================
     🗑️ DELETE TASK
  ============================== */

  deleteTask(id: number): void {

    this.pendingTasks = this.pendingTasks.filter(t => t.id !== id);
    this.doneTasks = this.doneTasks.filter(t => t.id !== id);

    this.service.delete(id).subscribe({
      next: () => {},
      error: (error) => {
        console.error('Erro ao excluir tarefa:', error);
      }
    });
  }

  /* ==============================
     🧲 DRAG & DROP (KANBAN REAL)
  ============================== */

  drop(event: CdkDragDrop<Task[]>) {

  // mesmo container → reorder
  if (event.previousContainer === event.container) {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    return;
  }

  // move entre colunas
  const task = event.previousContainer.data[event.previousIndex];

  // atualiza status
  task.completed = event.container.id.includes('done');

  this.refreshColumns();
}
}