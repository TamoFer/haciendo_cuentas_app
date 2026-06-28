import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { User } from '../models/user.model';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  collectionData,
  query,
  deleteDoc,
} from '@angular/fire/firestore';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  auth = inject(AngularFireAuth);
  utilsSvs = inject(UtilsService);
  storage = inject(AngularFireStorage);
  firestore = inject(Firestore); // API modular de @angular/fire


  // 🔐 Autenticación
  getAuth() {
    return getAuth();
  }

  signIn(user: User) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  signOut() {
    getAuth().signOut();
    localStorage.removeItem('user');
    this.utilsSvs.routerLink('/auth');
  }

  signUp(user: User) {
    return createUserWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, { displayName });
  }

  enviarRecuperacion(email: string) {
    return sendPasswordResetEmail(getAuth(), email);
  }

  // 📄 Base de datos - Firestore
  setDocument(path: string, data: any) {
    return setDoc(doc(this.firestore, path), data);
  }

  updateDocument(path: string, data: any) {
    return updateDoc(doc(this.firestore, path), data);
  }

  deleteDocument(path: string) {
    return deleteDoc(doc(this.firestore, path));
  }

  async getDocument(path: string) {
    const snapshot = await getDoc(doc(this.firestore, path));
    return snapshot.data();
  }

  addDocument(path: string, data: any) {
    return addDoc(collection(this.firestore, path), data);
  }

  getCollectionData(path: string, collectionQuery?: any) {
    const ref = collection(this.firestore, path);
    return collectionData(query(ref, collectionQuery), { idField: 'id' });
  }

  // 📊 Simulador Financiero - Gastos
  async addGastoSimulador(uid: string, gasto: any) {
    const path = `users/${uid}/gastosSimulador`;
    gasto.id = this.crearId();
    gasto.fechaCreacion = new Date();
    gasto.fechaFin = gasto.fechaFin || null;
    gasto.cantidadCuotas = gasto.cantidadCuotas || null;
    gasto.detalles = gasto.detalles || null;
    return this.addDocument(path, gasto);
  }

  async getGastosSimulador(uid: string) {
    const path = `users/${uid}/gastosSimulador`;
    return new Promise((resolve) => {
      this.getCollectionData(path).subscribe({
        next: (data) => {
          resolve(data);
        },
        error: () => {
          resolve([]);
        }
      });
    });
  }

  async updateGastoSimulador(uid: string, gastoId: string, data: any) {
    const path = `users/${uid}/gastosSimulador/${gastoId}`;
    data.fechaFin = data.fechaFin || null;
    data.cantidadCuotas = data.cantidadCuotas || null;
    data.detalles = data.detalles || null;
    data.nombre = data.nombre || '';
    data.categoria = data.categoria || 'Otros';
    data.importe = Number(data.importe) || 0;
    return this.updateDocument(path, data);
  }

  async deleteGastoSimulador(uid: string, gastoId: string) {
    const path = `users/${uid}/gastosSimulador/${gastoId}`;
    return this.deleteDocument(path);
  }

  async getUserData(uid: string) {
    const path = `users/${uid}`;
    return this.getDocument(path);
  }

  async updateUserData(uid: string, data: any) {
    const path = `users/${uid}`;
    return this.updateDocument(path, data);
  }

  crearId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
