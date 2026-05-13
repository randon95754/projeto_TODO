import { Component, OnInit, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray
} from '@angular/cdk/drag-drop';

registerLocaleData(localePt);

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
  private platformId = inject(PLATFORM_ID);

  pendingTasks: Task[] = [];
  doneTasks: Task[] = [];
  newTask: string = '';
  hasDeadline: boolean = false;
  dueDateValue: string = '';
  dueTimeValue: string = '23:59';
  isSidebarCollapsed = false;
  darkMode: boolean = false;
  activeTab: string = 'inicio';
  viewDate: Date = new Date();
  selectedDate: Date = new Date();
  calendarDays: Date[] = [];
  isDaySelected: boolean = false;

  constructor(
    private service: TaskService,
    private ngZone: NgZone
  ) {
    this.generateCalendar();
    if (isPlatformBrowser(this.platformId)) {
      const savedTab = localStorage.getItem('abaSelecionada');
      if (savedTab) this.activeTab = savedTab;
    }
  }


  generateCalendar(): void {
  const year = this.viewDate.getFullYear();
  const month = this.viewDate.getMonth();
  
  // 1. Pega o dia da semana em que o mês começa (0 = Domingo, 1 = Segunda...)
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayWeek = firstDayOfMonth.getDay();

  // 2. Pega o último dia (número) do mês
  const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
  
  const days: (Date | null)[] = [];
  
  // 3. Adiciona os espaços vazios (nulos) para alinhar o calendário
  for (let i = 0; i < startDayWeek; i++) {
    days.push(null);
  }

  // 4. Preenche os dias reais do mês (apenas uma vez!)
  for (let i = 1; i <= lastDateOfMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  // 5. Atualiza a lista que o HTML utiliza
  this.calendarDays = days as any;
}
// Navegação de meses
prevMonth(): void {
  this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
  this.generateCalendar();
}

nextMonth(): void {
  this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
  this.generateCalendar();
}

// Seleção de dia
selectDay(day: Date): void {
  this.selectedDate = day;
  this.isDaySelected = true;
}

shouldShowTaskOnDay(task: any, day: Date): boolean {
  // Zeramos as horas para comparar apenas as datas
  const targetDay = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  
  // REGRA 1: Sem prazo -> Aparece em todos os dias
  if (!task.hasDeadline || !task.dueDate) {
    return true;
  }

  // REGRA 2: Com prazo
  const start = new Date(task.createdAt);
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  
  const end = new Date(task.dueDate);
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

  // Retorna verdadeiro se o dia do calendário estiver entre o início e o fim (inclusive)
  return targetDay >= startDate && targetDay <= endDate;
}

isSelected(day: Date): boolean {
  return day.toDateString() === this.selectedDate.toDateString();
}

// Verifica se existe tarefa no dia (para mostrar a bolinha vermelha)
hasTasksOnDay(day: Date | null): boolean {
  if (!day) return false;

  const targetTime = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const allTasks = [...this.pendingTasks, ...this.doneTasks];

  return allTasks.some(task => {
    // REGRA 1: Ignorar se não houver prazo ou se faltarem datas essenciais
    if (!task.hasDeadline || !task.dueDate || !task.createdAt) {
      return false;
    }

    // REGRA 2: Converter datas garantindo que não são nulas
    const start = new Date(task.createdAt);
    const end = new Date(task.dueDate);

    const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

    // Cálculo do alerta (3 dias antes do fim)
    const alertTime = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 3).getTime();

    // REGRA 3: Lógica das bolinhas (Início, Alerta de 3 dias, Prazo Final)
    return targetTime === startTime || targetTime === alertTime || targetTime === endTime;
  });
}

get deadlineTasks(): any[] {
  const allTasks = this.getAllTasksFromSelectedDay();
  return allTasks.filter(t => t.hasDeadline === true || t.dueDate != null);
}

get continuousTasks(): any[] {
  const allTasks = this.getAllTasksFromSelectedDay();
  return allTasks.filter(t => t.hasDeadline === false || !t.dueDate);
}

private getAllTasksFromSelectedDay(): any[] {
  if (!this.selectedDate) return [];
  
  const combined = [...this.pendingTasks, ...this.doneTasks];
  
  // Filtra as tarefas que devem aparecer no dia (usando a lógica que criamos antes)
  const filtered = combined.filter(task => this.shouldShowTaskOnDay(task, this.selectedDate!));
  
  // Remove duplicatas por ID
  return Array.from(new Map(filtered.map(item => [item.id, item])).values());
}

// Getter para a lista abaixo do calendário
get tasksForSelectedDay() {
  if (!this.selectedDate) return [];

  const allTasks = [...this.pendingTasks, ...this.doneTasks];
  
  return allTasks.filter(task => this.shouldShowTaskOnDay(task, this.selectedDate!));
}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTheme();
      const saved = localStorage.getItem('minhasTarefas');
      if (saved) {
        const allTasks = JSON.parse(saved);
        this.doneTasks = allTasks.filter((t: any) => t.completed);
        const pending = allTasks.filter((t: any) => !t.completed);
        this.pendingTasks = this.sortByPriority(pending);
      } else {
        this.loadTasks();
      }
    }
  }

  // --- NAVEGAÇÃO ---
  navigateTo(tabName: string) {
    this.activeTab = tabName;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('abaSelecionada', tabName);
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // --- PERSISTÊNCIA ---
  saveTasks() {
    if (isPlatformBrowser(this.platformId)) {
      const all = [...this.pendingTasks, ...this.doneTasks];
      localStorage.setItem('minhasTarefas', JSON.stringify(all));
    }
  }

  // --- DARK MODE ---
  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.toggle('dark', this.darkMode);
      localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
    }
  }

  loadTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      this.darkMode = savedTheme === 'dark';
      document.body.classList.toggle('dark', this.darkMode);
    }
  }

  // --- LOGICA DE TAREFAS ---
  loadTasks(): void {
    this.service.getAll().subscribe({
      next: (data: Task[]) => {
        const tasks = data.map(t => ({ ...t, editing: false }));
        this.doneTasks = tasks.filter(t => t.completed);
        this.pendingTasks = this.sortByPriority(tasks.filter(t => !t.completed));
        this.saveTasks();
      }
    });
  }

  addTask(): void {
    const title = this.newTask.trim();
    if (!title) return;

    let dueDateTime: Date | null = null;
    if (this.hasDeadline && this.dueDateValue) {
      dueDateTime = new Date(`${this.dueDateValue}T${this.dueTimeValue}:00`);
    }

    const task: Task = {
      title,
      completed: false,
      createdAt: new Date(),
      dueDate: dueDateTime,
      hasDeadline: this.hasDeadline
    };

    this.service.create(task).subscribe({
      next: (createdTask: any) => {
        this.ngZone.run(() => {
          const newTaskObj = {
            ...createdTask,
            editing: false,
            dueDate: dueDateTime,
            hasDeadline: this.hasDeadline
          };
          this.pendingTasks.unshift(newTaskObj);
          this.pendingTasks = this.sortByPriority(this.pendingTasks);
          this.saveTasks();
          this.newTask = '';
          this.hasDeadline = false;
        });
      }
    });
  }

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
    this.saveTasks();
  }

  deleteTask(id: number): void {
    this.pendingTasks = this.pendingTasks.filter(t => t.id !== id);
    this.doneTasks = this.doneTasks.filter(t => t.id !== id);
    this.saveTasks();
    this.service.delete(id).subscribe();
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      this.toggleTask(task);
    }
    this.saveTasks();
  }

  // --- PRAZOS E PRIORIDADES ---
  getTimeRemaining(task: Task): { text: string; status: 'normal' | 'warning' | 'expired' } {
    if (!task.hasDeadline || !task.dueDate) return { text: '', status: 'normal' };
    
    const now = new Date().getTime();
    const due = new Date(task.dueDate).getTime();
    const diff = due - now;

    if (diff <= 0) return { text: '⏰ Expirado', status: 'expired' };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % 86400000) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % 3600000) / (1000 * 60));

    let text = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
    const status = days < 3 ? 'warning' : 'normal';
    
    return { text, status };
  }

  private sortByPriority(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      const now = new Date().getTime();
      const aExp = a.hasDeadline && a.dueDate && new Date(a.dueDate).getTime() < now;
      const bExp = b.hasDeadline && b.dueDate && new Date(b.dueDate).getTime() < now;
      
      if (aExp && !bExp) return -1;
      if (!aExp && bExp) return 1;
      
      if (a.hasDeadline && b.hasDeadline && a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      if (!a.hasDeadline && b.hasDeadline) return 1;
      if (a.hasDeadline && !b.hasDeadline) return -1;
      return 0;
    });
  }

  selectedTask: any = null; // Armazena a tarefa que foi clicada

// Função para abrir os detalhes
openTaskDetails(task: any) {
  this.selectedTask = task;
}

// Função para fechar/salvar
closeDetails() {
  if (this.selectedTask) {
    // Como usamos [(ngModel)], os dados já estão alterados no objeto.
    // Basta chamar o seu método que salva o array inteiro no localStorage.
    this.saveTasks();
  }
  this.selectedTask = null;
}
}