import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddUpdtDeleteGastoComponent } from './add-updt-delete-gasto.component';

describe('AddUpdtDeleteGastoComponent', () => {
  let component: AddUpdtDeleteGastoComponent;
  let fixture: ComponentFixture<AddUpdtDeleteGastoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddUpdtDeleteGastoComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AddUpdtDeleteGastoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
