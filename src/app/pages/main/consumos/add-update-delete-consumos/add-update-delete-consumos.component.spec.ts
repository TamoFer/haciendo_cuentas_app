import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddUpdateDeleteConsumosComponent } from './add-update-delete-consumos.component';

describe('AddUpdateDeleteConsumosComponent', () => {
  let component: AddUpdateDeleteConsumosComponent;
  let fixture: ComponentFixture<AddUpdateDeleteConsumosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddUpdateDeleteConsumosComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AddUpdateDeleteConsumosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
