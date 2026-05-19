import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule, isPlatformBrowser, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ChangeDetectorRef, Component, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task';
import { TaskService } from '../../services/task.service';

registerLocaleData(localePt);

@Component({
  selector: 'app-task',
  standalone: true,
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css'],
  imports: [FormsModule, CommonModule, DragDropModule],
})
export class TaskComponent implements OnInit {
  // ==========================================
  // INJEÇÃO DE DEPENDÊNCIAS (Modern Angular)
  // ==========================================
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // ESTADO / PROPRIEDADES DO COMPONENTE
  // ==========================================
  // Métricas e Painéis
  completedToday: number = 0;
  upcomingTasks: number = 0;
  productivity: number = 0;
  tasksDueToday: number = 0;

  // Listas de Tarefas
  todayTasks: Task[] = [];
  nextTasks: Task[] = [];
  pendingTasks: Task[] = [];
  doneTasks: Task[] = [];

  // Formulário e Criação de Nova Tarefa
  newTask: string = '';
  hasDeadline: boolean = false;
  dueDateValue: string = '';
  dueTimeValue: string = '23:59';

  // Interface de Usuário (Layout / Tema)
  isSidebarCollapsed = false;
  darkMode: boolean = false;
  activeTab: string = 'inicio';

  // Calendário
  viewDate: Date = new Date();
  selectedDate: Date = new Date();
  calendarDays: Date[] = [];
  isDaySelected: boolean = false;

  // Detalhes da Tarefa Selecionada
  selectedTask: any = null;

  // ==========================================
  // CONSTRUTOR E CICLO DE VIDA
  // ==========================================
  constructor(
    private service: TaskService,
    private ngZone: NgZone,
  ) {
    // Inicializa a grade de dias do calendário
    this.generateCalendar();

    // Restaura a aba ativa do localStorage se estiver rodando no navegador
    if (isPlatformBrowser(this.platformId)) {
      const savedTab = localStorage.getItem('abaSelecionada');
      if (savedTab) this.activeTab = savedTab;
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTheme();
      const saved = localStorage.getItem('tasks');

      if (saved) {
        const rawTasks = JSON.parse(saved);
        // Trata e converte as strings de data salvas para instâncias de Date locais
        const allTasks: Task[] = rawTasks.map((t: any) => ({
          ...t,
          createdAt: t.createdAt
            ? new Date(
                new Date(t.createdAt)
                  .toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
                  .replace(',', ''),
              )
            : new Date(),
          dueDate: t.dueDate
            ? new Date(
                new Date(t.dueDate)
                  .toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
                  .replace(',', ''),
              )
            : null,
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

  // ==========================================
  // CORE: LÓGICA DE GERENCIAMENTO DE TAREFAS
  // ==========================================

  /**
   * Busca todas as tarefas remotas a partir do serviço Spring Boot
   */
  loadTasks(): void {
    this.service.getAll().subscribe({
      next: (data: Task[]) => {
        const tasks = data.map((t) => ({ ...t, editing: false }));
        this.doneTasks = tasks.filter((t) => t.completed);
        this.pendingTasks = this.sortByPriority(tasks.filter((t) => !t.completed));
        this.saveTasks();
      },
    });
  }

  /**
   * Cria uma nova tarefa validando prazos e atualizando o estado do componente
   */
  addTask(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // 🛡️ Trava contra SSR (Executa apenas no navegador)
    if (!isPlatformBrowser(this.platformId)) return;

    const title = this.newTask.trim();
    if (!title) return;

    let dueDateTime: Date | null = null;
    if (this.hasDeadline && this.dueDateValue) {
      const [year, month, day] = this.dueDateValue.split('-').map(Number);
      const [hours, minutes] = this.dueTimeValue.split(':').map(Number);
      dueDateTime = new Date(year, month - 1, day, hours, minutes, 0);
    }

    const task: Task = {
      id: Date.now(),
      title,
      completed: false,
      createdAt: new Date(),
      dueDate: dueDateTime,
      hasDeadline: this.hasDeadline,
    };

    // Envia para o Spring Boot
    this.service.create(task).subscribe({
      next: (createdTask: any) => {
        // Criamos o objeto finalizado vindo do servidor
        const newTaskObj = {
          ...createdTask,
          createdAt: new Date(createdTask.createdAt || new Date()),
          editing: false,
          dueDate: createdTask.dueDate ? new Date(createdTask.dueDate) : dueDateTime,
          hasDeadline: createdTask.hasDeadline ?? this.hasDeadline,
        };

        // 🔄 Atualiza a lista principal criando uma NOVA referência de array (Imutabilidade)
        this.pendingTasks = this.sortByPriority([newTaskObj, ...this.pendingTasks]);

        // 💡 IMPORTANTE: Se a sua tela inicial (ou aba atual) renderiza 'todayTasks'
        // ou outra lista, você precisa atualizar essa lista específica aqui também!
        // Exemplo: this.updateCategorizedLists();

        // Salva e abre os detalhes
        this.saveTasks();
        this.openTaskDetails(newTaskObj);

        // Limpa o formulário
        this.newTask = '';
        this.hasDeadline = false;
        this.dueDateValue = '';
        this.dueTimeValue = '23:59';

        // Força o Angular a renderizar a tela AGORA com os novos dados
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao adicionar tarefa:', err);
      },
    });
  }

  /**
   * Altera o estado de conclusão (concluído/pendente) mudando a tarefa de lista
   */
  toggleTask(task: Task) {
    task.completed = !task.completed;
    if (task.completed) {
      task.completedAt = new Date();
      this.pendingTasks = this.pendingTasks.filter((t) => t.id !== task.id);
      this.doneTasks.unshift(task);
    } else {
      task.completedAt = undefined;
      this.doneTasks = this.doneTasks.filter((t) => t.id !== task.id);
      this.pendingTasks.unshift(task);
      this.pendingTasks = this.sortByPriority(this.pendingTasks);
    }
    this.saveTasks();
  }

  /**
   * Remove fisicamente a tarefa do client-side e envia a requisição de exclusão ao backend
   */
  deleteTask(id: number): void {
    this.pendingTasks = this.pendingTasks.filter((t) => t.id !== id);
    this.doneTasks = this.doneTasks.filter((t) => t.id !== id);
    this.saveTasks();
    this.service.delete(id).subscribe();
  }

  /**
   * Captura as atualizações de inputs manuais de data dentro do painel de detalhes
   */
  updateTaskDate(event: any) {
    const dateValue = event.target.value;
    if (this.selectedTask && dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number);
      const d = this.selectedTask.dueDate ? new Date(this.selectedTask.dueDate) : new Date();

      d.setFullYear(year, month - 1, day);
      this.selectedTask.dueDate = new Date(d);
      this.saveTasks();
    }
  }

  /**
   * Captura as atualizações de inputs manuais de horário dentro do painel de detalhes
   */
  updateTaskTime(event: any) {
    if (this.selectedTask && event.target.value) {
      const [hours, minutes] = event.target.value.split(':').map(Number);
      const newDate = this.selectedTask.dueDate ? new Date(this.selectedTask.dueDate) : new Date();

      newDate.setHours(hours, minutes);
      this.selectedTask.dueDate = newDate;
      this.saveTasks();
    }
  }

  /**
   * Controla a persistência das tarefas via Drag and Drop do CDK Angular
   */
  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      this.toggleTask(task);
    }
    this.saveTasks();
  }

  /**
   * Atualiza o contador numérico de tarefas pendentes agendadas para o dia atual
   */
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

  // ==========================================
  // LÓGICA DE ALERTA, PRAZOS E PRIORIDADES
  // ==========================================

  /**
   * Determina a criticidade do prazo para estilizações css condicionais
   */
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

  /**
   * Calcula textualmente o tempo restante ou atraso de uma tarefa em tempo real
   */
  getTimeRemaining(task: Task): { text: string; status: 'normal' | 'warning' | 'expired' } {
    if (!task.hasDeadline || !task.dueDate) return { text: '', status: 'normal' };

    const now = new Date().getTime();
    const due = new Date(task.dueDate).getTime();
    const diff = due - now;

    if (diff <= 0) return { text: '⏰ Expirado', status: 'expired' };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % 86400000) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % 3600000) / (1000 * 60));

    let text = '';
    if (days > 0) {
      text = `${days} dias ${hours}h`;
    } else if (hours > 0) {
      text = `${hours}h ${minutes}min`;
    } else {
      text = `${minutes}min`;
    }

    const status = days < 3 ? 'warning' : 'normal';
    return { text, status };
  }

  /**
   * Exibe uma contagem simplificada de dias restantes amigável para listagens compactas
   */
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

  /**
   * Ordena coleções de tarefas colocando itens expirados e de prazos mais curtos no topo
   */
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

  // ==========================================
  // SISTEMA DE VISUALIZAÇÃO E CALENDÁRIO
  // ==========================================

  /**
   * Monta a estrutura matricial matemática do calendário baseado na visualização do mês corrente
   */
  generateCalendar(): void {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayWeek = firstDayOfMonth.getDay();
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];

    // Alinha os dias da primeira semana pulando os slots necessários
    for (let i = 0; i < startDayWeek; i++) {
      days.push(null);
    }

    // Preenche com instâncias reais de datas normalizadas no meio do dia
    for (let i = 1; i <= lastDateOfMonth; i++) {
      const date = new Date(year, month, i, 12, 0, 0);
      days.push(date);
    }

    this.calendarDays = days as any;
  }

  prevMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  selectDay(day: Date): void {
    this.selectedDate = day;
    this.isDaySelected = true;
  }

  isSelected(day: Date): boolean {
    return day.toDateString() === this.selectedDate.toDateString();
  }

  /**
   * Regra condicional complexa para decidir o mapeamento de tarefas em dias específicos do calendário
   */
  shouldShowTaskOnDay(task: any, day: Date): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const targetDay = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();

    if (!task.hasDeadline || !task.dueDate) {
      return true;
    }

    const start = new Date(task.createdAt);
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();

    const end = new Date(task.dueDate);
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

    const threeDaysBeforeMS = endDate - 3 * 24 * 60 * 60 * 1000;
    const threeDaysBeforeDate = new Date(threeDaysBeforeMS);
    const threeDaysBefore = new Date(
      threeDaysBeforeDate.getFullYear(),
      threeDaysBeforeDate.getMonth(),
      threeDaysBeforeDate.getDate(),
    ).getTime();

    const isCreationDay = targetDay === startDate;
    const isDueDate = targetDay === endDate;
    const isThreeDaysAlert = targetDay === threeDaysBefore && targetDay >= today;

    return targetDay >= startDate && targetDay <= endDate;
  }

  /**
   * Varre o repositório de tarefas determinando se o dia deve receber sinalizador visual de alerta
   */
  hasTasksOnDay(day: Date): boolean {
    const target = new Date(day);
    target.setHours(0, 0, 0, 0);
    const targetTime = target.getTime();

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayTime = now.getTime();

    return [...this.pendingTasks, ...this.doneTasks].some((task) => {
      if (!task.createdAt) return false;

      const createdAt = new Date(task.createdAt);
      createdAt.setHours(0, 0, 0, 0);
      const creationTime = createdAt.getTime();

      if (creationTime === targetTime) return true;

      if (task.hasDeadline && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const dueTime = dueDate.getTime();

        if (dueTime === targetTime) return true;

        const warningDate = new Date(dueDate);
        warningDate.setDate(warningDate.getDate() - 3);
        warningDate.setHours(0, 0, 0, 0);
        const warningTime = warningDate.getTime();

        if (targetTime === warningTime && targetTime >= todayTime) {
          return true;
        }
      }

      return false;
    });
  }

  // ==========================================
  // GETTERS DE FILTRO E AUXILIARES (Calendário)
  // ==========================================

  get deadlineTasks(): any[] {
    const allTasks = this.getAllTasksFromSelectedDay();
    return allTasks.filter((t) => t.hasDeadline === true || t.dueDate != null);
  }

  get continuousTasks(): any[] {
    const allTasks = this.getAllTasksFromSelectedDay();
    return allTasks.filter((t) => t.hasDeadline === false || !t.dueDate);
  }

  get tasksForSelectedDay() {
    if (!this.selectedDate) return [];
    const allTasks = [...this.pendingTasks, ...this.doneTasks];
    return allTasks.filter((task) => this.shouldShowTaskOnDay(task, this.selectedDate!));
  }

  private getAllTasksFromSelectedDay(): any[] {
    if (!this.selectedDate) return [];
    const combined = [...this.pendingTasks, ...this.doneTasks];
    const filtered = combined.filter((task) => this.shouldShowTaskOnDay(task, this.selectedDate!));
    return Array.from(new Map(filtered.map((item) => [item.id, item])).values());
  }

  // ==========================================
  // FILTROS AVANÇADOS / SPRINT BOARD VIEW
  // ==========================================

  /**
   * Filtra tarefas resolvidas no exato dia corrente
   */
  get tasksCompletedToday(): Task[] {
    const today = new Date();
    return this.doneTasks.filter((task) => {
      if (!task.completedAt) return false;
      const completionDate = new Date(task.completedAt);
      return completionDate.toDateString() === today.toDateString();
    });
  }

  /**
   * Agrupa e ordena prazos que expiram dentro dos próximos 7 dias úteis (ignorando o dia de hoje)
   */
  get upcomingDeadlines(): Task[] {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return this.pendingTasks
      .filter((task) => {
        if (!task.hasDeadline || !task.dueDate) return false;

        const dueDate = new Date(task.dueDate);
        const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        if (due.getTime() === today.getTime()) return false;

        return due > today && due <= sevenDaysFromNow;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }

  /**
   * Estrutura a agenda diária organizando tarefas por nível estrito de severidade (Expiradas > Hoje > Sem Prazo)
   */
  get dailyAgenda(): Task[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return this.pendingTasks
      .filter((task) => {
        if (!task.hasDeadline || !task.dueDate) return true;

        const due = new Date(task.dueDate);
        const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());

        return dueDate.getTime() <= today.getTime();
      })
      .sort((a, b) => {
        const getPriority = (t: Task) => {
          if (!t.hasDeadline || !t.dueDate) return 3;

          const due = new Date(t.dueDate);
          const d = new Date(due.getFullYear(), due.getMonth(), due.getDate());

          const isExpired = d.getTime() < today.getTime();
          const isToday = d.getTime() === today.getTime();

          if (isExpired) return 0;
          if (isToday) return 1;
          return 2;
        };

        return getPriority(a) - getPriority(b);
      });
  }

  isTodayAgenda(task: any): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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

  // ==========================================
  // INTERFACE DE DETALHES E COMPORTAMENTO UI
  // ==========================================

  openTaskDetails(task: any) {
    this.selectedTask = task;
    const d = task.dueDate ? new Date(task.dueDate) : new Date();

    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    this.dueDateValue = `${year}-${month}-${day}`;

    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    this.dueTimeValue = `${hours}:${minutes}`;
  }

  closeDetails() {
    if (this.selectedTask) {
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

  // ==========================================
  // PERSISTÊNCIA LOCAL & TEMAS
  // ==========================================

  saveTasks() {
    const dataToSave = [...this.pendingTasks, ...this.doneTasks].map((t) => ({
      ...t,
      createdAt:
        t.createdAt instanceof Date
          ? t.createdAt.toLocaleString('sv-SE').replace(' ', 'T')
          : t.createdAt,
      dueDate:
        t.dueDate instanceof Date ? t.dueDate.toLocaleString('sv-SE').replace(' ', 'T') : t.dueDate,
    }));

    localStorage.setItem('tasks', JSON.stringify(dataToSave));
  }

  navigateTo(tabName: string) {
    this.activeTab = tabName;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('abaSelecionada', tabName);
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

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
}
