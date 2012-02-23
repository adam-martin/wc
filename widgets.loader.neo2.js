var widgetControls = [];

var WidgetController = function() {

    var $_ = Object();

  /** Свойства
   */

    $_.templates = [];
    $_.scripts   = [];

    $_.widgets   = [];

  // Свойства


  /** Методы
   */

    /**
     * loadXMLContent
     * загружает шаблон виджетов из xml-файла
     */
    $_.loadXMLContent = function( file_name /* String */, fn  /* Callback */)
    {
        $.get
        (
            file_name ,
            function( data )  // data -> xml-content
            {
                $_.xml_content = data;
                $_.loadTemplate();
                fn();
            } // $.get callback
        ) // $.get
    } // .loadXMLContent


    /**
     * addTemplate
     * Оборачивает тело шаблона в <div> и
     * добавляет в глобальный массив templates
     *
     * <- name - имя виджета
     * <- temp - xml-узел шаблона виджета
     */
    $_.addTemplate = function ( name /* String */, temp  /* XMLElement */ )
    {
        var temp_text   = $( temp ).text(),
            widget_body = $( '<div>' )
                           .attr( 'class' , name )
                           .append( temp_text );

        $_.templates[ name ] = widget_body /* HTMLElement */;

    } // .addTemplate


    /**
     * getTemplate
     * Возвращаем шаблан виджета по его имени
     *
     * <- name - имя виджета
     * -> HTMLDivElement
     */
    $_.getTemplate = function ( name /* String */ )
    {
        return $_.templates[ name ]; /* HTMLDivElement */
    }; // .getTemplate


    /**
     * getScript
     * Возвращаем скрипт виджета по его имени
     *
     * <- name - имя виджета
     * -> WidgetScript
     */
    $_.getScript = function ( name /* String */ )
    {
        return  $_.scripts[name]; /* WidgetScript */
    }; // .getScript


    /**
     * loadTemplate
     * Загружает все:
     * - шаблоны виджетов в массив templates[]
     * - скрипты виджетов в массив scripts[]
     */
    $_.loadTemplate = function ()
    {

        $( $_.xml_content ).find( 'widget' ).each
        (
            function ( index, value )
            {
                var name = $( value ).attr( 'name' );
                $_.addTemplate( name, value );
                $_.scripts[ name ] = widgetControls [ name ];

            } // .each function
        ) // .each

        /**
         * Обработка вложенных виджетов
         */
        for ( var widgetName in $_.templates )
        {
            var script   = widgetControls[ widgetName ],
                template = $_.getTemplate( widgetName );

            $( template ).find( 'widget' ).each
            (
                function ( index, item )
                {
                    var include_name     = $( item ).attr( 'include' ),
                        include_template = $_.getTemplate( include_name ),
                        include_script   = widgetControls[ include_name ];

                    $( item ).replaceWith( $( include_template ).clone() );

                    //$.extend( true, script, include_script );

                    // Объединение
                    for ( var brick in include_script ) {
                        if ( brick in script )
                        {
                            var actions = script[ brick ].actions,
                                include_actions = include_script[ brick ].actions;

                            for ( var action in include_actions ) {
                                if ( action in actions ) {
                                    actions[ '_' + action ] = include_actions[ action ];
                                } else {
                                    actions[ action ] = include_actions[ action ];
                                }
                            } // foreach include_actions

                            var events = script[ brick ].events,
                                include_events = include_script[ brick ].events;

                            for ( var event in include_events ) {
                                if ( event in events ) {
                                    events[ '_' + event ] = include_events[ event ];
                                } else {
                                    events[ event ] = include_events[ event ];
                                }
                            } // foreach include_events
                        }
                        else
                        {
                            script[ brick ] = include_script[ brick ];
                        } // if (i in script)
                    } // foreach include_script
                } // .each iterator
            ) // .each find( 'widget' )
        } // foreach templates
    }; // .loadTemplate


    /**
     * buildWidget
     * Создает и возвращает экземпляр виджета заданного именем name
     *
     * <- name - имя виджета
     * -> Widget
     */
    $_.buildWidget = function ( type /* String */, name /* String */, params /* json */ )
    {
        var __obj = Widget( type, $_, params);

        $_.widgets[ name ] = __obj;

        return __obj /* Widget */

    } // .buildWidget


    /**
     * loadWidgets
     * Загружает виджеты и выполняет callback после удачной загрузки
     *
     * <- callback - подпрограмма
     */
    $_.loadWidgets = function( callback )
    {
        $_.loadXMLContent
        (
            '/widgets/layouts.xml',
            function ()
            {
                $( '.' + 'source_selector' ).each(
                    function ( index, value )
                    {
                        var name   = $( value ).attr( 'name' ),
                            widget = $_.buildWidget( 'source_selector', name, value );

                        $( value ).replaceWith( widget.template );
                    } // each function
                ) // each

                callback();
            } // loadXMLContent callback
        ) // loadXMLContent
    } // .loadWidgets

    /**
     * widgets
     * Возвращает виджет из массива widgets, заданный именем name
     *
     * <- name - имя виджета
     * -> Widget
     */
    $_.widgets = function ( name /* String */ )
    {
        return $_.widgets[ name ] /* Widget */

    } // .widgets

  // Методы

    return $_ /* Instance */

}; // class WidgetController


var Widget = function( name /* String */, wc /* WidgetController */, params /* json */ )
{
    var  $_ = Object();

  /** Свойства
   */

    $_.name      = name;
    $_.template  = wc.getTemplate( name ).clone();
    $_.logic     = wc.getScript( name );
    $_.etalon    = [];
    $_.brick     = [];
    $_.data      = {};

    $_.params    = params;

  // Свойства


  /** Методы
   */

    /**
     * callback
     * Инициирует триггер-подписчик
     * Возвращает данные data по событию из виджета
     *
     * <- data - возвращаемые данные
     */
    $_.callback = function( data )
    {
        $_.template.trigger( '__callback', data );
    } // .callback


    /**
     * eventHandler
     * Устанавливает обработчика события дла триггера-подписчика текущего виджета
     *
     * <- fn - подпрограмма
     */
    $_.eventHandler = function( fn )
    {
        $_.template.bind( '__callback', fn );
    } // .eventHandler

  // Методы


  /**
   * Конструктор
   */

    var brick_name;

    for ( brick_name in $_.logic )
    {
        $_.etalon[ brick_name ] = $_.template.find( '.' + brick_name ).clone();
    } // foreach logic

    for ( brick_name in $_.logic )
    {
        var brick = Brick( brick_name, $_ );

        $_.template.find( '.' + brick_name ).replaceWith( brick.template );
        $_.brick[ brick_name ] = brick;
    } // foreach logic


  // Конструктор

    return $_ /* Instance */

}; // class Widget

var Brick = function( name /* String */, widget /* Widget */ )
{
    var  $_ = Object();

  /** Свойства
   */

    $_.name      = name;
    $_.widget    = widget;
    $_.template  = $( widget.etalon[ name ] ).clone();
    $_.logic     = widget.logic[ name ];

  // Свойства


  /** Методы
   */

    /**
     * getInstance
     * Создает и возвращает экземпляр Brick
     *
     * -> Brick
     */
    $_.getInstance = function () /* Widget */
    {
        var obj = new Brick( $_.name, $_.widget );

        obj.bindEvents();
        obj.bindActions();

        return obj; /* Widget */

    } // .getInstance


    /**
     * bindEvents
     * Устанавливаем свой обработчик внешних событий logic.events
     * делаем замыкание на свой обработчик
     */
    $_.bindEvents = function ()
    {
        var bind_list = {},
            events = $_.logic.events;

        for ( var event in events )
        {
          ( function( __obj, event )
            {
                bind_list[ event ] = function()
                {
                    __obj[ event ]()
                }; // function
            }(  $_, event ) ); // function

            $_[ event ] = events[ event ];

        } // foreach events
        $_.template.bind( bind_list );

        bind_list = null
    } // .bindEvents


    /**
     * bindActions
     * Устанавливаем дополнительные методы logic.actions
     * Обарбатываем предустановленные функции
     */
    $_.bindActions = function ()
    {
        var actions = $_.logic.actions;

        for ( var action in actions )
        {
            $_[ action ] = actions[ action ];
        } // foreach actions

        if ( typeof $_.logic.actions.__before == 'function' )
        {
            $_['__before']( $_.widget.params );
        } // if __before
    } // .bindActions


    /**
     * bricks
     * Получаем объект из коллекции по имени
     * <- name - имя элемента
     * -> Brick
     */
    $_.bricks = function ( name /* String */ )
    {
        return $_.widget.brick[ name ];
    } // .bricks

  // Методы


  /**
   * Конструктор
   */

    $_.bindEvents();
    $_.bindActions();

  // Конструктор

    return $_ /* Instance */

}; // class Brick