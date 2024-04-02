import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { HttpClientModule } from '@angular/common/http';
import { FooterComponent } from './footer/footer.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavbarComponent, HttpClientModule, RouterOutlet, RouterModule, FooterComponent, NgbModule],
  templateUrl: 'app.component.html' ,
  styleUrl: 'app.component.css'
})
export class AppComponent {
  title = 'stock-search';
}
