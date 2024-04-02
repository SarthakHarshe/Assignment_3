import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SearchComponent } from '../search/search.component';
import { SearchDetailsComponent } from '../search-details/search-details.component';
import { SearchStateService } from '../services/search-state.service';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-search-layout',
  standalone: true,
  imports: [RouterOutlet, SearchComponent, SearchDetailsComponent, CommonModule, FooterComponent],
  templateUrl: './search-layout.component.html',
  styleUrl: './search-layout.component.css'
})
export class SearchLayoutComponent implements OnInit{

  hasSearchResults: boolean = false;

  constructor(private searchStateService: SearchStateService) {}

  ngOnInit() {
    this.searchStateService.hasSearchResults.subscribe(status => {
      this.hasSearchResults = status;
    });
  }

}
