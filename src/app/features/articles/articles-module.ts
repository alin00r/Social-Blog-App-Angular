import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Articles } from './pages/articles/articles';
import { Editor } from './pages/editor/editor';

@NgModule({
  declarations: [Articles, Editor],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class ArticlesModule {}
