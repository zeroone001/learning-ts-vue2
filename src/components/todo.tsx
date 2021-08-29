import { Component, Emit, Prop, Vue, Watch } from 'vue-property-decorator';
import './todo.scss';

interface Item {
    text: string;
    age: number;
}

@Component({
    name: 'Todo',
})

export default class Todo extends Vue {
    // 断言
    @Prop(Object) public item!: Item;
    @Prop(Number) public num!: number;

    @Prop(Number)
    public numberIndexs!: number;

    // public numberIndexs: number = 1;
    public theModel: string = '111';

    @Watch('numberIndexs', { immediate: true, deep: true })
    public handleWatch(index: number): void {
        console.log('index---->', this.numberIndexs);
    }
    @Emit('handleSave')
    public handleSaveEvent() {
        return '12312321';
    }

    public clickEvent(that: any): void {
        this.handleSaveEvent();
    }

    protected render() {
        return (<li class='li' >
            <input type='text' v-model={this.theModel} />
            <a-icon type='edit' nativeOn-click={this.clickEvent.bind(this)}></a-icon>
        { this.item.text }
        </li>);
    }

}
