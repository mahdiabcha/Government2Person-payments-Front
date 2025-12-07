import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProfileDialogComponent } from './admin-profile-dialog.component';

describe('AdminProfileDialogComponent', () => {
  let component: AdminProfileDialogComponent;
  let fixture: ComponentFixture<AdminProfileDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProfileDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminProfileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
