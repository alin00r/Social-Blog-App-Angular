import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Users } from './pages/users/users';

@NgModule({
  declarations: [Users],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class UsersModule {}
