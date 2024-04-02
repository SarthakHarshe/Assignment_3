import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'aggregateMSPR',
  standalone: true
})
export class AggregateMSPRPipe implements PipeTransform {
  transform(data: any[]): number {
    if (!data) {
      return 0;
    }
    return data.reduce((total, item) => total + item.mspr, 0);
  }
}

// aggregateChange.pipe.ts
@Pipe({
  name: 'aggregateChange',
  standalone: true
})
export class AggregateChangePipe implements PipeTransform {
  transform(data: any[]): number {
    if (!data) {
      return 0;
    }
    return data.reduce((total, item) => total + item.change, 0);
  }
}

// aggregatePositiveMSPR.pipe.ts
@Pipe({
  name: 'aggregatePositiveMSPR',
  standalone: true
})
export class AggregatePositiveMSPRPipe implements PipeTransform {
  transform(data: any[]): number {
    if (!data) {
      return 0;
    }
    return data.filter(item => item.mspr > 0).reduce((total, item) => total + item.mspr, 0);
  }
}

// aggregatePositiveChange.pipe.ts
@Pipe({
  name: 'aggregatePositiveChange',
  standalone: true
})
export class AggregatePositiveChangePipe implements PipeTransform {
  transform(data: any[]): number {
    if (!data) {
      return 0;
    }
    return data.filter(item => item.change > 0).reduce((total, item) => total + item.change, 0);
  }
}

// aggregateNegativeMSPR.pipe.ts
@Pipe({
  name: 'aggregateNegativeMSPR',
  standalone: true
})
export class AggregateNegativeMSPRPipe implements PipeTransform {
  transform(data: any[]): number {
    if (!data) {
      return 0;
    }
    return data.filter(item => item.mspr < 0).reduce((total, item) => total + item.mspr, 0);
  }
}

// aggregateNegativeChange.pipe.ts
@Pipe({
  name: 'aggregateNegativeChange',
  standalone: true
})
export class AggregateNegativeChangePipe implements PipeTransform {
  transform(data: any[]): number {
    if (!data) {
      return 0;
    }
    return data.filter(item => item.change < 0).reduce((total, item) => total + item.change, 0);
  }
}
