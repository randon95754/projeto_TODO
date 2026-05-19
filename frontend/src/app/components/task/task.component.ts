import { Component, OnInit, NgZone, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);
  completedToday: number = 0;
  upcomingTasks: number = 0;
  productivity: number = 0;

  todayTasks: Task[] = [];
  nextTasks: Task[] = [];
  tasksDueToday: number = 0;
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

  getDeadlineStatus(task: any): 'normal' | 'warning' | 'expired' | 'continuous' {
  if (!task?.dueDate) return 'continuous';

  const now = new Date();
  const due = new Date(task.dueDate);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= 3) return 'warning';
  return 'normal';
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
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetDay = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();

  // REGRA 1: Sem prazo -> Aparece em todos os dias
  if (!task.hasDeadline || !task.dueDate) {
    return true;
  }

  // REGRA 2: Definição de datas importantes
  const start = new Date(task.createdAt);
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  
  const end = new Date(task.dueDate);
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

  // Cálculo de 3 dias antes do vencimento
  const threeDaysBeforeMS = endDate - (3 * 24 * 60 * 60 * 1000);
  const threeDaysBeforeDate = new Date(threeDaysBeforeMS);
  const threeDaysBefore = new Date(threeDaysBeforeDate.getFullYear(), threeDaysBeforeDate.getMonth(), threeDaysBeforeDate.getDate()).getTime();

  // CONDIÇÕES PARA MOSTRAR A BOLINHA:
  
  // 1. Mostrar no dia da criação
  const isCreationDay = targetDay === startDate;

  // 2. Mostrar no dia do vencimento
  const isDueDate = targetDay === endDate;

  // 3. Mostrar no dia de "3 dias antes", MAS apenas se esse dia ainda não passou em relação a HOJE
  // E se a tarefa não estiver concluída (opcional, dependendo do seu objeto task)
  const isThreeDaysAlert = targetDay === threeDaysBefore && targetDay >= today;

  return targetDay >= startDate && targetDay <= endDate;
}

isSelected(day: Date): boolean {
  return day.toDateString() === this.selectedDate.toDateString();
}

// Verifica se existe tarefa no dia (para mostrar a bolinha vermelha)
hasTasksOnDay(day: Date): boolean {
  const target = new Date(day);
  target.setHours(0, 0, 0, 0);
  const targetTime = target.getTime();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayTime = now.getTime();

  return [...this.pendingTasks, ...this.doneTasks].some(task => {
    if (!task.createdAt) return false;

    const createdAt = new Date(task.createdAt);
    createdAt.setHours(0, 0, 0, 0);
    const creationTime = createdAt.getTime();

    // 1) PONTO FIXO: Dia da Criação (Sempre mostra)
    if (creationTime === targetTime) return true;

    if (task.hasDeadline && task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const dueTime = dueDate.getTime();

      // 2) PONTO FIXO: Dia do Vencimento (Sempre mostra)
      if (dueTime === targetTime) return true;

      // 3) PONTO DINÂMICO: Alerta de 3 dias
      const warningDate = new Date(dueDate);
      warningDate.setDate(warningDate.getDate() - 3);
      warningDate.setHours(0, 0, 0, 0);
      const warningTime = warningDate.getTime();

      // Mostra a bolinha apenas se for o dia do aviso E o dia for hoje ou futuro
      if (targetTime === warningTime && targetTime >= todayTime) {
        return true;
      }
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
    const saved = localStorage.getItem('tasks');
    
    if (saved) {
      const rawTasks = JSON.parse(saved);
      const allTasks: Task[] = rawTasks.map((t: any) => ({
        ...t,
        // Força a data a ser lida como local ignorando qualquer sufixo de fuso
        createdAt: t.createdAt ? new Date(new Date(t.createdAt).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }).replace(',', '')) : new Date(),
        dueDate: t.dueDate ? new Date(new Date(t.dueDate).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }).replace(',', '')) : null
      }));

      this.doneTasks = allTasks.filter((t: Task) => t.completed);
      const pending = allTasks.filter((t: Task) => !t.completed);
      this.pendingTasks = this.sortByPriority(pending);
    } else {
      this.loadTasks();
    }
  }
  this.updateTasksDueToday();
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
  const dataToSave = [...this.pendingTasks, ...this.doneTasks].map(t => ({
    ...t,
    // Salva a data como uma string simples YYYY-MM-DD HH:mm:ss (sem o Z no final)
    createdAt: t.createdAt instanceof Date ? t.createdAt.toLocaleString('sv-SE').replace(' ', 'T') : t.createdAt,
    dueDate: t.dueDate instanceof Date ? t.dueDate.toLocaleString('sv-SE').replace(' ', 'T') : t.dueDate
  }));
  
  localStorage.setItem('tasks', JSON.stringify(dataToSave));
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
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  if (!isPlatformBrowser(this.platformId)) return;
  const title = this.newTask.trim();
  if (!title) return;

  let dueDateTime: Date | null = null;
  
  if (this.hasDeadline && this.dueDateValue) {
    // 1. Quebramos a string "2026-05-13" e "22:51" em números
    const [year, month, day] = this.dueDateValue.split('-').map(Number);
    const [hours, minutes] = this.dueTimeValue.split(':').map(Number);

    // 2. Criamos o Date passando os parâmetros um a um.
    // IMPORTANTE: O mês no JS começa em 0 (Janeiro = 0, Maio = 4)
    dueDateTime = new Date(year, month - 1, day, hours, minutes, 0);
  }

  const task: Task = {
    id: Date.now(), // Garanta que tem um ID se o service não gerar na hora
    title,
    completed: false,
    createdAt: new Date(), // Isso pega o exato momento atual local
    dueDate: dueDateTime,
    hasDeadline: this.hasDeadline
  };
  this.service.create(task).subscribe({
    next: (createdTask: any) => {
      // 2. O ngZone garante que a atualização ocorra dentro do ciclo do Angular
      this.ngZone.run(() => {
        const newTaskObj = {
          ...createdTask,
          createdAt: new Date(),
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

        this.dueDateValue = ''; 
      this.dueTimeValue = '23:59';
      this.cdr.detectChanges();
      });
    },
    error: (err) => {
      console.error('Erro ao adicionar tarefa:', err);
    }
  });
}

// Adicione isso ao seu TaskComponent
// No seu task.component.ts
updateTaskDate(event: any) {
  const dateValue = event.target.value; // formato "YYYY-MM-DD"
  if (this.selectedTask && dateValue) {
    const [year, month, day] = dateValue.split('-').map(Number);
    const d = this.selectedTask.dueDate ? new Date(this.selectedTask.dueDate) : new Date();
    
    // Usar setFullYear com os 3 parâmetros é o jeito mais seguro de manter a HORA local
    d.setFullYear(year, month - 1, day); 
    
    this.selectedTask.dueDate = new Date(d); // Cria nova instância para disparar o Change Detection
    this.saveTasks();
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
    task.completedAt = new Date(); // Registra o momento da conclusão
    this.pendingTasks = this.pendingTasks.filter(t => t.id !== task.id);
    this.doneTasks.unshift(task);
  } else {
    task.completedAt = undefined; // Remove a data se desmarcar
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

    // Caso já tenha passado do prazo
    if (diff <= 0) return { text: '⏰ Expirado', status: 'expired' };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % 86400000) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % 3600000) / (1000 * 60));

    // Montagem do texto dinâmico
    let text = '';
    if (days > 0) {
      text = `${days} dias ${hours}h`;
    } else if (hours > 0) {
      text = `${hours}h ${minutes}min`;
    } else {
      text = `${minutes}min`;
    }

    // Lógica de status: warning se faltar menos de 3 dias
    const status = days < 3 ? 'warning' : 'normal';
    
    return { text, status };
}

formatDaysRemainingOnly(task: any): string {
  if (!task?.dueDate) return 'contínua';

  const now = new Date();
  const due = new Date(task.dueDate);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expirado';
  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return '1 dia';
  if (diffDays === 2) return '2 dias';

  return `${diffDays} dias`;
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

openTaskDetails(task: any) {
  this.selectedTask = task;
  
  const d = task.dueDate ? new Date(task.dueDate) : new Date();

  // Formata YYYY-MM-DD manualmente para evitar o fuso do toISOString
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  this.dueDateValue = `${year}-${month}-${day}`;

  // Formata HH:mm manualmente
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  this.dueTimeValue = `${hours}:${minutes}`;
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

getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';

  return 'Boa noite';
}

updateTasksDueToday() {

  const today = new Date();

  this.tasksDueToday = this.pendingTasks.filter((task: Task) => {

    if (!task.dueDate) return false;

    const dueDate = new Date(task.dueDate);

    return (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    );

  }).length;

}


// --- NOVAS LÓGICAS DE FILTRO ---

// 1. Tarefas concluídas HOJE (independente de quando foram criadas)
get tasksCompletedToday(): Task[] {
  const today = new Date();
  return this.doneTasks.filter(task => {
    if (!task.completedAt) return false;
    const completionDate = new Date(task.completedAt);
    return completionDate.toDateString() === today.toDateString();
  });
}

// 2. Coluna Próximas Tarefas (Faltam 3 dias ou menos para encerrar)
get upcomingDeadlines(): Task[] {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return this.pendingTasks
    .filter(task => {
      if (!task.hasDeadline || !task.dueDate) return false;

      const dueDate = new Date(task.dueDate);
      const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

      // EXCLUI hoje (vai pra agenda do dia)
      if (due.getTime() === today.getTime()) return false;

      // somente próximos 7 dias
      return due > today && due <= sevenDaysFromNow;
    })
    .sort((a, b) =>
      new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    );
}

// 3. Coluna Agenda do Dia (Com a hierarquia solicitada)
get dailyAgenda(): Task[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return this.pendingTasks
    .filter(task => {
      // SEM PRAZO → sempre entra
      if (!task.hasDeadline || !task.dueDate) return true;

      const due = new Date(task.dueDate);
      const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());

      // ENTRA SE:
      // - é hoje
      // - OU está expirada
      return (
        dueDate.getTime() <= today.getTime()
      );
    })
    .sort((a, b) => {
      const getPriority = (t: Task) => {
        if (!t.hasDeadline || !t.dueDate) return 3; // sem prazo

        const due = new Date(t.dueDate);
        const d = new Date(due.getFullYear(), due.getMonth(), due.getDate());

        const isExpired = d.getTime() < today.getTime();
        const isToday = d.getTime() === today.getTime();
        

        if (isExpired) return 0; // 🔴 prioridade máxima
        if (isToday) return 1;   // 🟡 hoje
        return 2;
      };

      return getPriority(a) - getPriority(b);
    });
}

isTodayAgenda(task: any): boolean {
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Sem prazo → entra na agenda do dia
  if (!task?.hasDeadline || !task?.dueDate) return true;

  const due = new Date(task.dueDate);
  const target = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  return target.getTime() === today.getTime();
}

isUpcomingTask(task: any): boolean {
  if (!task?.hasDeadline || !task?.dueDate) return false;

  const now = new Date();
  const due = new Date(task.dueDate);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 && diffDays <= 7;
}

}