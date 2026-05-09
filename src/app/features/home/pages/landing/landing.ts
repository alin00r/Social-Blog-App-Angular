import { Component } from '@angular/core';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-landing',
  standalone: false,
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  constructor(public authService: Auth) {}
}
