import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  title = 'Bienvenido a Bumper Plates';
  subtitle = 'Tu app para ayudarte a levantar mejor 😉';
}
