import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Requests } from './requests';

describe('Requests', () => {
  let component: Requests;
  let fixture: ComponentFixture<Requests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Requests],
    }).compileComponents();

    fixture = TestBed.createComponent(Requests);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
