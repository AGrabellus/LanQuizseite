import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AnklickbarComponent } from './anklickbar/anklickbar.component';
import { Smart10Component } from './smart10/smart10.component';
import { MemoryComponent } from './memory/memory.component';
import { WuerfelComponent } from './wuerfel/wuerfel.component';
import { BrettspielComponent } from './brettspiel/brettspiel.component';
import { PerfectMatchComponent } from './perfect-match/perfect-match.component';
import { MinesweeperComponent } from './minesweeper/minesweeper.component';
import { RubbelloseComponent } from './rubbellose/rubbellose.component';

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'anklickbar/:file', component: AnklickbarComponent },
	{ path: 'smart10/:file', component: Smart10Component },
	{ path: 'memory/:file', component: MemoryComponent },
	{ path: 'wuerfel', component: WuerfelComponent },
	{ path: 'brettspiel', component: BrettspielComponent },
	{ path: 'perfect-match', component: PerfectMatchComponent },
	{ path: 'minesweeper', component: MinesweeperComponent },
	{ path: 'rubbellose', component: RubbelloseComponent },
	{ path: '**', redirectTo: '' }
];
