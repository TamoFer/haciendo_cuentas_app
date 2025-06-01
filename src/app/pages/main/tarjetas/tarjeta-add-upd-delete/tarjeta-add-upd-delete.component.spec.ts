import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TarjetaAddUpdDeleteComponent } from './tarjeta-add-upd-delete.component';

describe('TarjetaAddUpdDeleteComponent', () => {
  let component: TarjetaAddUpdDeleteComponent;
  let fixture: ComponentFixture<TarjetaAddUpdDeleteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TarjetaAddUpdDeleteComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaAddUpdDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
