import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Usuario, TipoUsuario, CreateUsuarioRequest } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuarioForm: FormGroup;
  editingUsuario: Usuario | null = null;
  showForm = false;
  loading = false;
  tiposUsuario = Object.values(TipoUsuario);

  constructor(
    private usuarioService: UsuarioService,
    private fb: FormBuilder
  ) {
    this.usuarioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(12)]],
      tipo: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.loading = true;
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading usuarios:', error);
        this.loading = false;
      }
    });
  }

  openCreateForm(): void {
    this.editingUsuario = null;
    this.usuarioForm.reset();
    // Para crear usuario, password es requerido
    this.usuarioForm.get('password')?.setValidators([Validators.required, Validators.minLength(12)]);
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.showForm = true;
  }

  openEditForm(usuario: Usuario): void {
    this.editingUsuario = usuario;
    this.usuarioForm.patchValue({
      nombre: usuario.nombre,
      email: usuario.email,
      tipo: usuario.tipo,
      password: '' // Dejar vacío para edición
    });
    // Para editar, password es opcional
    this.usuarioForm.get('password')?.setValidators([Validators.minLength(12)]);
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingUsuario = null;
    this.usuarioForm.reset();
  }

  onSubmit(): void {
    if (this.usuarioForm.valid) {
      const usuarioData: CreateUsuarioRequest = this.usuarioForm.value;
      
      if (this.editingUsuario) {
        this.updateUsuario(this.editingUsuario.id_usuario!, usuarioData);
      } else {
        this.createUsuario(usuarioData);
      }
    }
  }

  createUsuario(usuarioData: CreateUsuarioRequest): void {
    this.usuarioService.createUsuario(usuarioData).subscribe({
      next: (usuario) => {
        this.usuarios.push(usuario);
        this.closeForm();
        alert('Usuario creado exitosamente. El usuario deberá configurar MFA en su primer login.');
      },
      error: (error) => {
        console.error('Error creating usuario:', error);
        alert('Error al crear usuario: ' + (error.error?.error || 'Error desconocido'));
      }
    });
  }

  updateUsuario(id: number, usuarioData: CreateUsuarioRequest): void {
    this.usuarioService.updateUsuario(id, usuarioData).subscribe({
      next: (usuario) => {
        const index = this.usuarios.findIndex(u => u.id_usuario === id);
        if (index !== -1) {
          this.usuarios[index] = usuario;
        }
        this.closeForm();
        alert('Usuario actualizado exitosamente.');
      },
      error: (error) => {
        console.error('Error updating usuario:', error);
        alert('Error al actualizar usuario: ' + (error.error?.error || 'Error desconocido'));
      }
    });
  }

  deleteUsuario(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      this.usuarioService.deleteUsuario(id).subscribe({
        next: () => {
          this.usuarios = this.usuarios.filter(u => u.id_usuario !== id);
          alert('Usuario eliminado exitosamente.');
        },
        error: (error) => {
          console.error('Error deleting usuario:', error);
          alert('Error al eliminar usuario: ' + (error.error?.error || 'Error desconocido'));
        }
      });
    }
  }

  getMFAStatus(usuario: Usuario): string {
    return usuario.mfa_enabled ? 'Activo' : 'Pendiente';
  }

  getMFAStatusClass(usuario: Usuario): string {
    return usuario.mfa_enabled ? 'badge-success' : 'badge-warning';
  }
}