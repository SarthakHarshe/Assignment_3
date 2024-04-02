import { Component } from '@angular/core';
import { SearchComponent } from '../search/search.component';
import { SearchDetailsComponent } from '../search-details/search-details.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SearchComponent, SearchDetailsComponent, RouterOutlet],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
