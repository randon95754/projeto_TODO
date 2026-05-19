import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/task';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  // Altere AQUI: Troque o localhost pela URL do seu backend no Render
  private api = 'https://projeto-todo-yv8n.onrender.com/';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(this.api);
  }

  create(task: Task): Observable<Task> {
    return this.http.post<Task>(this.api, task);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}