import { Routes, RouterModule } from '@angular/router';
import { SearchComponent } from './search/search.component';
import { SearchDetailsComponent } from './search-details/search-details.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { WatchlistComponent } from './watchlist/watchlist.component';
import { HomeComponent } from './home/home.component';
import { SearchLayoutComponent } from './search-layout/search-layout.component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'search', 
    pathMatch: 'full' 
  },
  { 
    path: 'search', 
    component: SearchLayoutComponent,
    children: [
      {
        path: '', // Child route path for SearchComponent
        component: SearchComponent,
      },
      {
        path: ':ticker', // Child route path for SearchDetailsComponent with dynamic ticker parameter
        component: SearchDetailsComponent,
      },
    ] 
  },
  { 
    path: 'watchlist', 
    component: WatchlistComponent, 
    title: 'Watchlist' 
  },
  { 
    path: 'portfolio', 
    component: PortfolioComponent, 
    title: 'Portfolio' 
  }
];