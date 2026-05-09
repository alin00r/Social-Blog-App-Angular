import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private toastr: ToastrService) {}

  success(message: string, title: string = 'Success'): void {
    this.toastr.success(message, title, {
      timeOut: 3000,
      positionClass: 'toast-top-right',
      progressBar: true,
      progressAnimation: 'increasing',
    });
  }

  error(message: string, title: string = 'Error'): void {
    this.toastr.error(message, title, {
      timeOut: 4000,
      positionClass: 'toast-top-right',
      progressBar: true,
      progressAnimation: 'increasing',
    });
  }

  warning(message: string, title: string = 'Warning'): void {
    this.toastr.warning(message, title, {
      timeOut: 3500,
      positionClass: 'toast-top-right',
      progressBar: true,
      progressAnimation: 'increasing',
    });
  }

  info(message: string, title: string = 'Info'): void {
    this.toastr.info(message, title, {
      timeOut: 3000,
      positionClass: 'toast-top-right',
      progressBar: true,
      progressAnimation: 'increasing',
    });
  }
}
