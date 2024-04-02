import { Component } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject, OnInit } from '@angular/core';
import { NewsItem } from '../news-details.model';
import { faTwitter, faFacebookSquare } from '@fortawesome/free-brands-svg-icons';
import { faIcons } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EllipsisModule } from 'ngx-ellipsis';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons';


@Component({
  selector: 'app-news-detail-dialog',
  standalone: true,
  imports: [EllipsisModule, FontAwesomeModule],
  templateUrl: './news-detail-dialog.component.html',
  styleUrls: ['./news-detail-dialog.component.css']
})
export class NewsDetailDialogComponent implements OnInit{

  newsItem: any;
  faTwitter = faTwitter;
  faFacebookSquare = faFacebookSquare;
  formattedDate: string; 
  faXTwitter = faXTwitter;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { newsItem: NewsItem }, 
  public dialogRef: MatDialogRef<NewsDetailDialogComponent>) {
    this.newsItem = data.newsItem;
    this.formattedDate = '';
  }
  
  
  ngOnInit(): void {
    this.formattedDate = this.formatDate(this.newsItem.datetime);
  }

  formatDate(unixTimestamp: number): string {
    const date = new Date(unixTimestamp * 1000); // Convert UNIX timestamp to milliseconds
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }


  // Add methods for sharing on social media
   // Function to generate the Twitter share URL
   getTwitterShareUrl(): string {
    const text = encodeURIComponent(this.newsItem.headline);
    const url = encodeURIComponent(this.newsItem.url);
    return `https://twitter.com/intent/tweet?text=${text}%20${url}`;
  }

  // Function to generate the Facebook share URL
  getFacebookShareUrl(): string {
    const url = encodeURIComponent(this.newsItem.url);
    return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  }


}
