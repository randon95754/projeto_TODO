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
    const date = new Date(year, month, i, 12, 0, 0);
    days.push(date);
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
hasTasksOnDay(day: Date): boolean {
  const target = new Date(day);

  // Remove horas para comparar apenas datas
  target.setHours(0, 0, 0, 0);

  return [...this.pendingTasks, ...this.doneTasks].some(task => {

    // DATA DE CRIAÇÃO
    if (!task.createdAt) {
    return false;
}

    const createdAt = new Date(task.createdAt);
    createdAt.setHours(0, 0, 0, 0);

    // 1) BOLINHA NO DIA DA CRIAÇÃO
    const isCreationDay =
      createdAt.getTime() === target.getTime();

    if (isCreationDay) {
      return true;
    }

    // 2) TAREFAS COM PRAZO
    if (task.hasDeadline && task.dueDate) {

      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      // DIA DO VENCIMENTO
      const isDueDay =
        dueDate.getTime() === target.getTime();

      // 3 DIAS ANTES
      const warningDate = new Date(dueDate);
      warningDate.setDate(warningDate.getDate() - 3);
      warningDate.setHours(0, 0, 0, 0);

      const isWarningDay =
        warningDate.getTime() === target.getTime();

      return isDueDay || isWarningDay;
    }

    return false;
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
      // 1. Convertemos o JSON para um array genérico
      const rawTasks = JSON.parse(saved);
      
      // 2. MAPEAMOS o array para transformar strings de data em objetos Date reais
      const allTasks: Task[] = rawTasks.map((t: any) => ({
        ...t,
        // Converte a string de volta para objeto Date
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        // Faz o mesmo para o prazo, se existir
        dueDate: t.dueDate ? new Date(t.dueDate) : null
      }));

      // 3. Filtramos as tarefas usando os objetos já convertidos
      this.doneTasks = allTasks.filter((t: Task) => t.completed);
      const pending = allTasks.filter((t: Task) => !t.completed);
      
      // 4. Ordenamos as pendentes
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

addTask(event?: Event): void {
  // 1. Impede o comportamento padrão do formulário (que pode causar o refresh invisível)
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

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
      // 2. O ngZone garante que a atualização ocorra dentro do ciclo do Angular
      this.ngZone.run(() => {
        const newTaskObj = {
          ...createdTask,
          createdAt: new Date(createdTask.createdAt),
          editing: false,
          dueDate: dueDateTime,
          hasDeadline: this.hasDeadline
        };
        
        // 3. ATUALIZAÇÃO CRÍTICA: Em vez de .unshift(), criamos um NOVO array.
        // Isso força o Angular a disparar a detecção de mudanças imediatamente.
        const updatedList = [newTaskObj, ...this.pendingTasks];
        this.pendingTasks = this.sortByPriority(updatedList);
        
        this.saveTasks();

        // 4. Abre os detalhes e reseta os campos
        this.openTaskDetails(newTaskObj);
        this.newTask = '';
        this.hasDeadline = false;
      });
    },
    error: (err) => {
      console.error('Erro ao adicionar tarefa:', err);
    }
  });
}

// Adicione isso ao seu TaskComponent
updateTaskDate(event: any) {
  if (this.selectedTask && event.target.value) {
    const dateStr = event.target.value; // Formato YYYY-MM-DD
    const currentTime = this.selectedTask.dueDate ? 
                        new Date(this.selectedTask.dueDate) : 
                        new Date();
    
    // Mantém a hora atual, mas muda o dia, mês e ano
    const [year, month, day] = dateStr.split('-').map(Number);
    const newDate = new Date(currentTime);
    newDate.setFullYear(year, month - 1, day);
    
    this.selectedTask.dueDate = newDate;
    this.selectedTask.hasDeadline = true;
    this.saveTasks(); // Persiste a mudança
  }
}

updateTaskTime(event: any) {
  if (this.selectedTask && event.target.value) {
    const [hours, minutes] = event.target.value.split(':').map(Number);
    const newDate = this.selectedTask.dueDate ? 
                    new Date(this.selectedTask.dueDate) : 
                    new Date();
    
    newDate.setHours(hours, minutes);
    this.selectedTask.dueDate = newDate;
    this.saveTasks();
  }
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
  
  // Se a tarefa acabou de ser criada, o JS pode ter jogado ela para o dia 14 (UTC)
  // Vamos garantir que os inputs mostrem o dia 13 (Hoje)
  const dataLocal = new Date(task.createdAt);

  if (!this.selectedTask.dueDate) {
    // Força o input a mostrar a data baseada no dia em que você está agora
    this.dueDateValue = dataLocal.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
    this.dueTimeValue = '23:59';
  } else {
    const d = new Date(this.selectedTask.dueDate);
    this.dueDateValue = d.toLocaleDateString('en-CA');
    this.dueTimeValue = d.toTimeString().substring(0, 5);
  }
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