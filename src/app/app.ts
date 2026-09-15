import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend-barriodigital';

  constructor(private authService: MsalService) {}

  ngOnInit(): void {
    this.authService.handleRedirectObservable().subscribe();
  }
}