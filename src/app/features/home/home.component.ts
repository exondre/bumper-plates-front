
import { Component } from '@angular/core';
import packageJson from '../../../../package.json';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  title = 'Bienvenido a Bumper Plates';
  subtitle = 'Tu app para ayudarte a levantar mejor 😉';
  /** Current application version. */
  readonly version: string = (packageJson as { version: string }).version;
}
