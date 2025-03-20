import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductRecommendationComponent } from './product-recommendation.component';

describe('ProductRecommendationComponent', () => {
  let component: ProductRecommendationComponent;
  let fixture: ComponentFixture<ProductRecommendationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductRecommendationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductRecommendationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
