var widgetControls = [];

var WidgetController = function() {

    var $_ = Object();

  /** ��������
   */

    $_.templates = [];
    $_.scripts   = [];

    $_.widgets   = [];

  // ��������


  /** ������
   */

    /**
     * loadXMLContent
     * ��������� ������ �������� �� xml-�����
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
     * ����������� ���� ������� � <div> �
     * ��������� � ���������� ������ templates
     *
     * <- name - ��� �������
     * <- temp - xml-���� ������� �������
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
     * ���������� ������ ������� �� ��� �����
     *
     * <- name - ��� �������
     * -> HTMLDivElement
     */
    $_.getTemplate = function ( name /* String */ )
    {
        return $_.templates[ name ]; /* HTMLDivElement */
    }; // .getTemplate


    /**
     * getScript
     * ���������� ������ ������� �� ��� �����
     *
     * <- name - ��� �������
     * -> WidgetScript
     */
    $_.getScript = function ( name /* String */ )
    {
        return  $_.scripts[name]; /* WidgetScript */
    }; // .getScript


    /**
     * loadTemplate
     * ��������� ���:
     * - ������� �������� � ������ templates[]
     * - ������� �������� � ������ scripts[]
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
         * ��������� ��������� ��������
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

                    // �����������
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
     * ������� � ���������� ��������� ������� ��������� ������ name
     *
     * <- name - ��� �������
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
     * ��������� ������� � ��������� callback ����� ������� ��������
     *
     * <- callback - ������������
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
     * ���������� ������ �� ������� widgets, �������� ������ name
     *
     * <- name - ��� �������
     * -> Widget
     */
    $_.widgets = function ( name /* String */ )
    {
        return $_.widgets[ name ] /* Widget */

    } // .widgets

  // ������

    return $_ /* Instance */

}; // class WidgetController


var Widget = function( name /* String */, wc /* WidgetController */, params /* json */ )
{
    var  $_ = Object();

  /** ��������
   */

    $_.name      = name;
    $_.template  = wc.getTemplate( name ).clone();
    $_.logic     = wc.getScript( name );
    $_.etalon    = [];
    $_.brick     = [];
    $_.data      = {};

    $_.params    = params;

  // ��������


  /** ������
   */

    /**
     * callback
     * ���������� �������-���������
     * ���������� ������ data �� ������� �� �������
     *
     * <- data - ������������ ������
     */
    $_.callback = function( data )
    {
        $_.template.trigger( '__callback', data );
    } // .callback


    /**
     * eventHandler
     * ������������� ����������� ������� ��� ��������-���������� �������� �������
     *
     * <- fn - ������������
     */
    $_.eventHandler = function( fn )
    {
        $_.template.bind( '__callback', fn );
    } // .eventHandler

  // ������


  /**
   * �����������
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


  // �����������

    return $_ /* Instance */

}; // class Widget

var Brick = function( name /* String */, widget /* Widget */ )
{
    var  $_ = Object();

  /** ��������
   */

    $_.name      = name;
    $_.widget    = widget;
    $_.template  = $( widget.etalon[ name ] ).clone();
    $_.logic     = widget.logic[ name ];

  // ��������


  /** ������
   */

    /**
     * getInstance
     * ������� � ���������� ��������� Brick
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
     * ������������� ���� ���������� ������� ������� logic.events
     * ������ ��������� �� ���� ����������
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
     * ������������� �������������� ������ logic.actions
     * ������������ ����������������� �������
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
     * �������� ������ �� ��������� �� �����
     * <- name - ��� ��������
     * -> Brick
     */
    $_.bricks = function ( name /* String */ )
    {
        return $_.widget.brick[ name ];
    } // .bricks

  // ������


  /**
   * �����������
   */

    $_.bindEvents();
    $_.bindActions();

  // �����������

    return $_ /* Instance */

}; // class Brick