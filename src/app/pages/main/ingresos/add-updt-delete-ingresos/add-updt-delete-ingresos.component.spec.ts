import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddUpdtDeleteIngresosComponent } from './add-updt-delete-ingresos.component';

describe('AddUpdtDeleteIngresosComponent', () => {
  let component: AddUpdtDeleteIngresosComponent;
  let fixture: ComponentFixture<AddUpdtDeleteIngresosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddUpdtDeleteIngresosComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AddUpdtDeleteIngresosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
