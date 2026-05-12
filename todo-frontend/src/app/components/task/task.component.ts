import { Component, OnInit, NgZone } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
registerLocaleData(localePt);

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

  pendingTasks: Task[] = [];
  doneTasks: Task[] = [];
  
  newTask: string = '';
  
  hasDeadline: boolean = false;
  dueDateValue: string = '';
  dueTimeValue: string = '23:59';

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
      📥 LOAD TASKS
  ============================== */

  loadTasks(): void {
    this.service.getAll().subscribe({
      next: (data: Task[]) => {
        const tasks = data.map(t => ({
          ...t,
          editing: false
        }));
        
        this.doneTasks = tasks.filter(t => t.completed);
        
        const pending = tasks.filter(t => !t.completed);
        this.pendingTasks = this.sortByPriority(pending);
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas:', error);
      }
    });
  }

  /* ==============================
      ➕ ADD TASK COM PRAZO
  ============================== */

  addTask(): void {
    const title = this.newTask.trim();
    if (!title) return;

    let dueDateTime: Date | null = null;
    let hasDeadlineFlag = this.hasDeadline;

    if (this.hasDeadline && this.dueDateValue) {
      dueDateTime = new Date(`${this.dueDateValue}T${this.dueTimeValue}:00`);
      if (isNaN(dueDateTime.getTime())) {
        console.error('Data inválida');
        return;
      }
    } else {
      hasDeadlineFlag = false;
    }

    const task: Task = {
      title,
      completed: false,
      createdAt: new Date(),
      dueDate: dueDateTime,
      hasDeadline: hasDeadlineFlag
    };

    this.service.create(task).subscribe({
      next: (createdTask: any) => {
        this.ngZone.run(() => {
          const newTaskObj = {
            ...createdTask,
            editing: false,
            createdAt: createdTask.createdAt ?? new Date(),
            dueDate: dueDateTime,
            hasDeadline: hasDeadlineFlag
          };

          this.pendingTasks.unshift(newTaskObj);
          this.pendingTasks = this.sortByPriority(this.pendingTasks);

          this.newTask = '';
          this.hasDeadline = false;
          this.dueDateValue = '';
          this.dueTimeValue = '23:59';
        });
      },
      error: (error) => {
        console.error('Erro ao adicionar tarefa:', error);
      }
    });
  }

  /* ==============================
      🕒 CÁLCULO DO TEMPO RESTANTE
  ============================== */

  getTimeRemaining(task: Task): { text: string; status: 'normal' | 'warning' | 'expired' } {
    if (!task.hasDeadline || !task.dueDate) {
      return { text: '', status: 'normal' };
    }
    
    const now = new Date().getTime();
    const due = new Date(task.dueDate).getTime();
    const diff = due - now;

    if (diff <= 0) {
      return { text: '⏰ Expirado', status: 'expired' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (86400000)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (3600000)) / (1000 * 60));

    let text = '';
    if (days > 0) text = `${days}d ${hours}h`;
    else if (hours > 0) text = `${hours}h ${minutes}min`;
    else text = `${minutes}min`;

    const status = days < 3 ? 'warning' : 'normal';
    
    return { text, status };
  }

  /* ==============================
      🎯 PRIORIDADE (ordenar por prazo)
  ============================== */

  private sortByPriority(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      // Tarefas expiradas vão para o topo
      const aIsExpired = a.hasDeadline && a.dueDate && new Date(a.dueDate).getTime() < new Date().getTime();
      const bIsExpired = b.hasDeadline && b.dueDate && new Date(b.dueDate).getTime() < new Date().getTime();
      
      if (aIsExpired && !bIsExpired) return -1;
      if (!aIsExpired && bIsExpired) return 1;
      
      // Ambas expiradas ou ambas não expiradas: ordenar por data mais próxima
      if (a.hasDeadline && b.hasDeadline && a.dueDate && b.dueDate) {
        const timeA = new Date(a.dueDate).getTime();
        const timeB = new Date(b.dueDate).getTime();
        return timeA - timeB;
      }
      
      // Tarefas sem prazo vão para o final
      if (!a.hasDeadline && b.hasDeadline) return 1;
      if (a.hasDeadline && !b.hasDeadline) return -1;
      
      return 0;
    });
  }

  /* ==============================
      🗂️ LOGICA DE COLUNAS
  ============================== */

  toggleTask(task: Task) {
    task.completed = !task.completed;
    
    if (task.completed) {
      this.pendingTasks = this.pendingTasks.filter(t => t.id !== task.id);
      this.doneTasks.unshift(task);
    } else {
      this.doneTasks = this.doneTasks.filter(t => t.id !== task.id);
      this.pendingTasks.unshift(task);
      this.pendingTasks = this.sortByPriority(this.pendingTasks);
    }
  }

  deleteTask(id: number): void {
    this.pendingTasks = this.pendingTasks.filter(t => t.id !== id);
    this.doneTasks = this.doneTasks.filter(t => t.id !== id);
    
    this.service.delete(id).subscribe({
      error: (error) => console.error('Erro ao excluir tarefa:', error)
    });
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      return;
    }

    const task = event.previousContainer.data[event.previousIndex];
    task.completed = event.container.id.includes('done');
    
    if (task.completed) {
      this.pendingTasks = this.pendingTasks.filter(t => t.id !== task.id);
      this.doneTasks.unshift(task);
    } else {
      this.doneTasks = this.doneTasks.filter(t => t.id !== task.id);
      this.pendingTasks.unshift(task);
      this.pendingTasks = this.sortByPriority(this.pendingTasks);
    }
  }
}