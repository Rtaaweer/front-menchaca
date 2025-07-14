import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Consultorio, CreateConsultorioRequest } from '../../models/consultorio.model';
import { ConsultorioService } from '../../services/consultorio.service';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario, TipoUsuario } from '../../models/usuario.model';

@Component({
  selector: 'app-consultorios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './consultorios.component.html',
  styleUrls: ['./consultorios.component.css']
})
export class ConsultoriosComponent implements OnInit {
  consultorios: Consultorio[] = [];
  consultorioForm: FormGroup;
  editingConsultorio: Consultorio | null = null;
  showForm = false;
  loading = false;
  medicos: Usuario[] = [];

  constructor(
    private consultorioService: ConsultorioService,
    private usuarioService: UsuarioService,
    private fb: FormBuilder
  ) {
    this.consultorioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      tipo: ['', [Validators.required]],
      ubicacion: [''],
      medico_id: ['', [Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadConsultorios();
    this.loadMedicos();
  }

  loadConsultorios(): void {
    this.loading = true;
    this.consultorioService.getConsultorios().subscribe({
      next: (consultorios) => {
        this.consultorios = consultorios;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading consultorios:', error);
        this.loading = false;
      }
    });
  }

  openCreateForm(): void {
    this.editingConsultorio = null;
    this.consultorioForm.reset();
    this.showForm = true;
  }

  openEditForm(consultorio: Consultorio): void {
    this.editingConsultorio = consultorio;
    this.consultorioForm.patchValue({
      nombre: consultorio.nombre,
      tipo: consultorio.tipo,
      ubicacion: consultorio.ubicacion,
      medico_id: consultorio.medico_id
    });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingConsultorio = null;
    this.consultorioForm.reset();
  }

  onSubmit(): void {
    if (this.consultorioForm.valid) {
      const consultorioData: CreateConsultorioRequest = {
        nombre: this.consultorioForm.value.nombre,
        tipo: this.consultorioForm.value.tipo,
        ubicacion: this.consultorioForm.value.ubicacion || undefined,
        medico_id: this.consultorioForm.value.medico_id || undefined
      };
      
      if (this.editingConsultorio) {
        this.updateConsultorio(this.editingConsultorio.id_consultorio!, consultorioData);
      } else {
        this.createConsultorio(consultorioData);
      }
    }
  }

  createConsultorio(consultorioData: CreateConsultorioRequest): void {
    this.consultorioService.createConsultorio(consultorioData).subscribe({
      next: (consultorio) => {
        this.consultorios.push(consultorio);
        this.closeForm();
      },
      error: (error) => {
        console.error('Error creating consultorio:', error);
      }
    });
  }

  updateConsultorio(id: number, consultorioData: CreateConsultorioRequest): void {
    this.consultorioService.updateConsultorio(id, consultorioData).subscribe({
      next: (consultorio) => {
        const index = this.consultorios.findIndex(c => c.id_consultorio === id);
        if (index !== -1) {
          this.consultorios[index] = consultorio;
        }
        this.closeForm();
      },
      error: (error) => {
        console.error('Error updating consultorio:', error);
      }
    });
  }

  deleteConsultorio(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este consultorio?')) {
      this.consultorioService.deleteConsultorio(id).subscribe({
        next: () => {
          this.consultorios = this.consultorios.filter(c => c.id_consultorio !== id);
        },
        error: (error) => {
          console.error('Error deleting consultorio:', error);
        }
      });
    }
  }

  loadMedicos(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.medicos = usuarios.filter(u => u.tipo === TipoUsuario.MEDICO);
      },
      error: (error) => {
        console.error('Error loading medicos:', error);
      }
    });
  }

  getMedicoNombre(medicoId: number): string {
    const medico = this.medicos.find(m => m.id_usuario === medicoId);
    return medico ? medico.nombre : 'N/A';
  }
}