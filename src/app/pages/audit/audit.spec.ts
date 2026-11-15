import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Audit } from './audit';

describe('Audit', () => {
  let component: Audit;
  let fixture: ComponentFixture<Audit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Audit],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Audit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
