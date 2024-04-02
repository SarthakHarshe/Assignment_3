import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsDetailDialogComponent } from './news-detail-dialog.component';

describe('NewsDetailDialogComponent', () => {
  let component: NewsDetailDialogComponent;
  let fixture: ComponentFixture<NewsDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsDetailDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewsDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
