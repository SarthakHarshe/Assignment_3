import { Component } from '@angular/core';
import { RouterOutlet, RouterLinkActive, RouterLink, Router } from '@angular/router';
import  {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { SearchStateService } from '../services/search-state.service';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterOutlet, RouterLinkActive, RouterLink, NgbModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  constructor(private searchStateService: SearchStateService, private router: Router) { }

  activeLink = '';
  isNavbarCollapsed = true;


  setActiveLink(link: string) {
    this.activeLink = link;
  }

  clearAndNavigate() {
    this.searchStateService.clearSearchState(); // Clear the search state
    this.router.navigate(['/search']); // Navigate to the search component
  }


}
