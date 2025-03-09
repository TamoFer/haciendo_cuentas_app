import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecuperarPswdPage } from './recuperar-pswd.page';

describe('RecuperarPswdPage', () => {
  let component: RecuperarPswdPage;
  let fixture: ComponentFixture<RecuperarPswdPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RecuperarPswdPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
