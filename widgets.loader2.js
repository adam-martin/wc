var widgetControls = [];

var mainObject = function()
{
    this.widgetTemplates    = [];
    this.xmlContent         = null;

    this.addTemplate = function ( temp )
    {
        var name = $( temp ).attr( 'name' );
        var body = $( temp ).text();

        var _template = $( '<div>' );
        _template.attr( 'class' , name );
        _template.append( body );

        this.widgetTemplates[ name ] = _template;
    };

    this.updateTemplate = function ( name, body )
    {
        this.widgetTemplates[ name ] = body;
    };

    this.getTemplate = function ( name )
    {
        var widgetBody = this.widgetTemplates[ name ];

        return widgetBody;
    };

    /**
     * Comment
     */
    this.loadXMLContent = function ( fileName, fn )
    {
        var self = this;
        $.get
        (
            fileName ,
            function( data )  // data = xml content
            {
                self.xmlContent = data;
                fn();
            }
        )
    };

    this.loadTemplate = function ()
    {
        var self = this;
        $( self.xmlContent ).find( 'widget' ).each(
            function ( index, value )
            {
                self.addTemplate( value );
            }
        )

        for ( var widgetName in self.widgetTemplates )
        {
            console.log( 'my: ' + widgetName )
            var widgetLogic    = widgetControls[ widgetName ];
            var widgetTemplate = self.getTemplate( widgetName );

            $( widgetTemplate ).find( 'widget' ).each(
                function ( index, item )
                {
                    var includeName     = $( item ).attr( 'include' );
                    var includeTemplate = self.getTemplate( includeName );
                    $( item ).replaceWith( $( includeTemplate ).clone() );

                    var widget = widgetControls[ includeName ];
                    $.extend( true, widgetLogic, widget );
                }
            )
        }
    };

    this.buildWidget   = function ( widgetName, DOMElement )
    {
        var template = self.getTemplate( widgetName );
        var scripts  = widgetControls[ widgetName ];
        for ( var brickName in scripts )
        {

            getInstance( brickName );

        }

    }

    this.applyTemplate = function ()
    {
        var self = this;
        for ( var widgetName in self.widgetTemplates )
        {
            $( '.' + widgetName ).each(
                function ( index, value )
                {
                    self.buildWidget( widgetName, value );

                    var DOMElement = {
                        element         : value,
                        widgetTemplate  : self.getTemplate( widgetName ),
                        widgetLogic     : widgetControls[ widgetName ]
                    };


                    var widgetObject = function ()
                    {
                        var name        = widgetName;
                        var template    = self.getTemplate( widgetName );
                        var logic       = widgetControls[ widgetName ];

                        var events      = logic[ elementName ].events;
                        var actions     = logic[ elementName ].actions;

                        var widgetElement  = widgetTemplate.find( '.' + elementName );
                        var container = {};

                        this.getInstance = function ()
                        {

                        }

                        this.bindEvents = function ( controlElement )
                        {
                            var events = controlElement.events;
                            var container = controlElement.container;
                            var widgetElement = controlElement.widgetElement;
                            var bindList = {};

                            for ( var event in events )
                            {
                              ( function( name, event )
                                {
                                    bindList[ event ] = function()
                                    {
                                        container[ name ][ event ]()
                                    };
                                }( controlElement.elementName, event ) );

                                widgetElement[ event ] = events[ event ];
                            }
                            widgetElement.bind( bindList );

                            bindList = null
                        }

                    }


                    self.bindEventsAndActions( DOMElement )
                    $( value ).replaceWith( DOMElement.widgetTemplate );
                }
            )
        }
    }

    this.bindEventsAndActions = function ( DOMElement )
    {
        var container = {};
        var widgetControl   = DOMElement.widgetControl;
        var widgetTemplate  = DOMElement.widgetTemplate;

        for ( var elementName in widgetControl )
        {
            var widgetElement  = widgetTemplate.find( '.' + elementName );
            var controlElement =
            {
                container     : container,

                elementName   : elementName,
                widgetElement : widgetElement,

                events  : widgetControl[ elementName ].events,
                actions : widgetControl[ elementName ].actions
            };

            this.bindEvents(  controlElement );
            this.bindActions( controlElement );

            widgetElement.widget        = container;
            container[ elementName ]    = widgetElement

            if ( typeof container[ elementName ].__before == 'function' )
            {
                widgetElement.__before( DOMElement.element );
            }
        }

        for ( elementName in widgetControl )
        {
            if ( typeof container[ elementName ].__after == 'function' )
            {
                container[ elementName ].__after();
            }
        }
    }

    this.bindEvents = function ( controlElement )
    {
        var events = controlElement.events;
        var container = controlElement.container;
        var widgetElement = controlElement.widgetElement;
        var bindList = {};

        for ( var event in events )
        {
          ( function( name, event )
            {
                bindList[ event ] = function()
                {
                    container[ name ][ event ]()
                };
            }( controlElement.elementName, event ) );

            widgetElement[ event ] = events[ event ];
        }
        widgetElement.bind( bindList );

        bindList = null
    }

    this.bindActions = function ( controlElement )
    {
        var widgetElement   = controlElement.widgetElement;
        var actions         = controlElement.actions;

        for ( var action in actions )
        {
            widgetElement[ action ] = actions[ action ];
        }
    }
}

$(function ()
{
    var instance = new mainObject();

    instance.loadXMLContent
    (
        '/widgets/layouts.xml',
        function ()
        {
            instance.loadTemplate();
            instance.applyTemplate();
        }
    )
})