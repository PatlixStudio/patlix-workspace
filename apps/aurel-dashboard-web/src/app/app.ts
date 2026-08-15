import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ShellComponent } from './shell/shell';

@Component({
  imports: [RouterModule, ShellComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}