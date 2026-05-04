// task.component.ts

import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task',
  standalone: true,
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css'],
  
  imports: [FormsModule, CommonModule]
})
export class TaskComponent implements OnInit {

  tasks: Task[] = [];
  newTask: string = '';

  constructor(
    private service: TaskService,
    private cdr: ChangeDetectorRef, // Adicionada a vírgula aqui
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.service.getAll().subscribe({
      next: (data: Task[]) => {
        this.tasks = data;
        this.cdr.detectChanges(); 
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas:', error);
      }
    });
  }

  addTask(): void {
    const title = this.newTask.trim();

    if (!title) {
      return;
    }

    const task: Task = {
      title: title,
      completed: false
    };

    this.service.create(task).subscribe({
      next: () => {
        // Envolvendo no ngZone para garantir que o Angular detecte a mudança
        this.ngZone.run(() => {
          this.newTask = '';
          this.loadTasks(); 
        });
      },
      error: (error) => {
        console.error('Erro ao adicionar tarefa:', error);
      }
    });
  }

  deleteTask(id: number): void {
    this.service.delete(id).subscribe({
      next: () => {
        // Envolvendo no ngZone para garantir que o Angular detecte a mudança
        this.ngZone.run(() => {
          this.loadTasks();
        });
      },
      error: (error) => {
        console.error('Erro ao excluir tarefa:', error);
      }
    });
  }
}