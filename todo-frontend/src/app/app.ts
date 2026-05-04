import { Component } from '@angular/core';
import { TaskComponent } from './components/task/task.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TaskComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
