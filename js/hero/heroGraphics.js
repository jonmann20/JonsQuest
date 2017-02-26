/*
 * The graphics component of hero.
 */
class HeroGraphicsComponent {
	constructor() {
		this.shurikenReady = false;
		this.shuriken = new Image();
		
		this.shuriken.src = 'img/shuriken.png';
		this.shuriken.onload = () => {
			this.shurikenReady = true;
		};
	}
	
	drawBullets() {
		for(let bullet of hero.bulletArr) {
			let dirOffset = bullet.dirR ? hero.w : 0;
			bullet.deg += 5;
		
			if(this.shurikenReady) {
				Graphics.drawRotate(
					this.shuriken,
					bullet.pos.x + dirOffset,
					bullet.pos.y + 20,
					bullet.deg
				);
			}
		}
	}
}